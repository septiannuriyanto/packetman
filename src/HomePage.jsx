import { useState, useEffect, useRef, useCallback } from "react";
import {
  sjHeaderRef,
  sjDetailRef
} from "./FirebaseConfig";
import {
  query,
  orderBy,
  where,
  getDocs,
  limit,
  startAfter,
  limitToLast,
  endBefore
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import HardcopyTemplate from "./HardcopyTemplate";
import generatePDF, { Resolution, Margin } from "react-to-pdf";
import exportToExcel from "./ExcelConverter";
import React from "react"; 

// --- Komponen Utilitas: TextHighlighter ---
// Bertanggung jawab untuk membungkus kata kunci yang cocok dengan highlight kuning
const TextHighlighter = ({ text, highlight }) => {
    // Memastikan text dan highlight valid
    if (!text || !highlight || highlight.length === 0) {
        return <>{text}</>;
    }
    
    // RegExp global dan case-insensitive
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => (
                // Cek apakah bagian ini adalah hasil match
                // Menggunakan test() dan membandingkan part yang dipecah adalah teknik untuk memastikan hanya kata kunci yang di-highlight
                regex.test(part) && part.toLowerCase() === highlight.toLowerCase() ? (
                    <span key={i} className="bg-yellow-200 font-bold text-gray-900 rounded px-0.5">
                        {part}
                    </span>
                ) : (
                    <React.Fragment key={i}>{part}</React.Fragment>
                )
            ))}
        </>
    );
};


// --- Komponen Detail Row (Nested Expandable) ---
const DetailRow = ({ headerId, fetchItems, isExpanded, searchTerm }) => { 
    const [detailItems, setDetailItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isExpanded && detailItems.length === 0) {
            const loadItems = async () => {
                setLoading(true);
                try {
                    const data = await fetchItems(headerId);
                    setDetailItems(data);
                } catch (error) {
                    console.error("Failed to fetch detail items:", error);
                } finally {
                    setLoading(false);
                }
            };
            loadItems();
        } 
    }, [isExpanded, headerId, fetchItems, detailItems.length]);

    const contentRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(0);

    useEffect(() => {
      if (isExpanded && contentRef.current) {
        const timer = setTimeout(() => {
            setContentHeight(contentRef.current.scrollHeight);
        }, 50); 
        return () => clearTimeout(timer);
      } else if (!isExpanded) {
        setContentHeight(0);
      }
    }, [isExpanded, detailItems]); 

    // Helper untuk mengecek apakah item mengandung kata kunci pencarian
    const isItemMatch = (item, term) => {
        const lowerTerm = term.toLowerCase();
        return (
            item.namaBarang?.toLowerCase().includes(lowerTerm) ||
            item.satuan?.toLowerCase().includes(lowerTerm) ||
            item.referensi?.toLowerCase().includes(lowerTerm) ||
            item.qty?.toString().includes(lowerTerm)
        );
    };


    return (
        <tr className={`detail-row-wrapper ${isExpanded ? 'is-expanded' : ''}`}>
            <td colSpan={8} className="p-0 border-b border-gray-200">
                <div 
                    ref={contentRef}
                    style={{ 
                        maxHeight: isExpanded ? `${contentHeight}px` : '0', 
                        overflow: 'hidden', 
                        transition: 'max-height 0.2s ease-out', 
                    }}
                    className={`bg-gray-50`} 
                >
                    <div className="p-3"> 
                        <h4 className="font-bold text-gray-700 mb-2 border-b pb-1 text-sm">Detail Barang ({headerId})</h4>
                        {loading ? (
                            <div className="text-center py-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500 inline-block"></div>
                                <p className="text-xs text-gray-500 mt-2">Loading...</p>
                            </div>
                        ) : detailItems.length > 0 ? (
                            <table className="w-full text-xs table-auto">
                                <thead>
                                    <tr className="bg-gray-200 text-gray-700">
                                        <th className="p-2 border font-medium text-left">Nama Barang</th> 
                                        <th className="p-2 border font-medium w-16">Qty</th>
                                        <th className="p-2 border font-medium w-20">Satuan</th>
                                        <th className="p-2 border font-medium text-left w-64">Referensi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailItems.map((item, index) => {
                                        // LOGIKA HIGHLIGHT: Cek apakah baris ini cocok
                                        const isMatch = searchTerm.trim() && isItemMatch(item, searchTerm);
                                        const displayTerm = searchTerm.trim();
                                        
                                        return (
                                            <tr 
                                                key={index} 
                                                // Warna hijau muda untuk baris yang cocok
                                                className={`border-b ${isMatch ? 'bg-green-100/80 hover:bg-green-200' : 'hover:bg-gray-100'}`} 
                                            >
                                                <td className="p-2 border-l border-r text-gray-700">
                                                    <TextHighlighter text={item.namaBarang} highlight={displayTerm} />
                                                </td>
                                                <td className="p-2 border-r text-center font-mono">
                                                    <TextHighlighter text={item.qty?.toString()} highlight={displayTerm} />
                                                </td>
                                                <td className="p-2 border-r text-center">
                                                    <TextHighlighter text={item.satuan} highlight={displayTerm} />
                                                </td>
                                                <td className="p-2 border-r text-gray-600 text-xs">
                                                    <TextHighlighter text={item.referensi} highlight={displayTerm} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-gray-500 italic text-center py-3">Tidak ada detail barang.</p>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    );
};


const Homepage = () => {
    const [reportHeaderPrint, setReportHeaderPrint] = useState(null);
    const [reportDetailPrint, setReportDetailPrint] = useState(null);
    const [spbList, setSPBList] = useState([]); 
    const [reportNumber, setReportNumber] = useState(0);
    const [showReport, setShowReport] = useState(false);
    const [loading, setLoading] = useState(true);
    
    // State untuk menyimpan banyak ID yang di-expand
    const [expandedRowIds, setExpandedRowIds] = useState(new Set()); 

    // Pagination & Cursor
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(20);
    const [totalRecords, setTotalRecords] = useState(0);
    const [firstDoc, setFirstDoc] = useState(null);
    const [lastDoc, setLastDoc] = useState(null);
    
    // Search
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const navigate = useNavigate();
    const componentRef = useRef(null);
    const tableContainerRef = useRef(null);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    });

    const fetchReportItems = useCallback(async (id) => {
        try {
            const q = query(sjDetailRef, where("idSurat", "==", parseInt(id)));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((d) => d.data());
            return data.sort((a, b) => a.id - b.id);
        } catch (err) {
            console.error("fetchReportItems error:", err);
            return [];
        }
    }, []);
    
    // Logika Toggle: Menambah/Menghapus ID dari Set
    const toggleRow = (id) => {
        setExpandedRowIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };

    const resetExpand = () => setExpandedRowIds(new Set());

    // --- Pagination/Count Functions ---
    const getTotalCount = async () => {
        try {
            const snapshot = await getDocs(sjHeaderRef);
            setTotalRecords(snapshot.size);
        } catch (err) {
            console.error("Get total count error:", err);
        }
    };
    
    const fetchFirstPage = async () => {
        setLoading(true);
        try {
            const q = query(sjHeaderRef, orderBy("id", "desc"), limit(recordsPerPage));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((d) => d.data());
            
            setSPBList(data);
            setFirstDoc(snapshot.docs[0]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setCurrentPage(1);
            resetExpand(); 
        } catch (err) {
            console.error("Fetch first page error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNextPage = async () => {
        if (!lastDoc) return;
        setLoading(true);
        try {
            const q = query(sjHeaderRef, orderBy("id", "desc"), startAfter(lastDoc), limit(recordsPerPage));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((d) => d.data());
            
            if (data.length > 0) {
                setSPBList(data);
                setFirstDoc(snapshot.docs[0]);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setCurrentPage(prev => prev + 1);
                resetExpand(); 
                if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
            }
        } catch (err) {
            console.error("Fetch next page error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrevPage = async () => {
        if (!firstDoc) return;
        setLoading(true);
        try {
            const q = query(sjHeaderRef, orderBy("id", "desc"), endBefore(firstDoc), limitToLast(recordsPerPage));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map((d) => d.data());
            
            if (data.length > 0) {
                setSPBList(data);
                setFirstDoc(snapshot.docs[0]);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setCurrentPage(prev => prev - 1);
                resetExpand(); 
                if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
            }
        } catch (err) {
            console.error("Fetch prev page error:", err);
        } finally {
            setLoading(false);
        }
    };
    
    // ---------- FUNGSI SEARCH UTAMA DENGAN AUTO-EXPAND ----------
    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            handleClearSearch();
            return;
        }

        setLoading(true);
        setIsSearching(true);
        const searchLower = searchTerm.toLowerCase();
        
        // --- 1. Pencarian di Detail Items (sjDetailRef) ---
        let detailHeaderIds = new Set();
        try {
            const detailSnapshot = await getDocs(sjDetailRef);
            
            detailSnapshot.docs.forEach((d) => {
                const item = d.data();
                // Pencarian di kolom Nama Barang, Satuan, Referensi, atau Qty
                if (
                    item.namaBarang?.toLowerCase().includes(searchLower) ||
                    item.satuan?.toLowerCase().includes(searchLower) ||
                    item.referensi?.toLowerCase().includes(searchLower) ||
                    item.qty?.toString().includes(searchLower) 
                ) {
                    detailHeaderIds.add(item.idSurat);
                }
            });
        } catch (err) {
            console.error("Search detail error:", err);
        }
        
        // --- 2. Pencarian di Header (sjHeaderRef) ---
        const idsToExpand = new Set(); 

        try {
            const headerSnapshot = await getDocs(sjHeaderRef);
            const allHeaderData = headerSnapshot.docs.map((d) => d.data());
            
            const filteredHeaders = allHeaderData.filter((item) => {
                const isHeaderMatch = (
                    item.id?.toString().includes(searchLower) ||
                    item.spbType?.toLowerCase().includes(searchLower) ||
                    item.tujuan?.toLowerCase().includes(searchLower) ||
                    item.ekspedisi?.toLowerCase().includes(searchLower) ||
                    item.nopol?.toLowerCase().includes(searchLower) ||
                    item.creator?.toLowerCase().includes(searchLower)
                );

                // Gabungkan hasil pencarian header dan hasil pencarian detail
                if (isHeaderMatch || detailHeaderIds.has(item.id)) {
                    // Jika match karena detail, tambahkan ID ke Set idsToExpand
                    if (detailHeaderIds.has(item.id)) {
                        idsToExpand.add(item.id);
                    }
                    return true;
                }
                return false;
            });

            setSPBList(filteredHeaders);
            setTotalRecords(filteredHeaders.length);
            setCurrentPage(1);
            
            // --- 3. Pengaturan expandedRowIds ---
            setExpandedRowIds(idsToExpand);

            if (tableContainerRef.current) tableContainerRef.current.scrollTop = 0;
            
        } catch (err) {
            console.error("Search header error:", err);
            setSPBList([]);
            setTotalRecords(0);
        } finally {
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        setIsSearching(false);
        getTotalCount();
        fetchFirstPage();
        setExpandedRowIds(new Set());
    };

    useEffect(() => {
        getTotalCount();
        fetchFirstPage();
    }, []);

    // --- Helper Functions (Tanggal & PDF) ---
    const totalPages = Math.ceil(totalRecords / recordsPerPage);

    const parseTimestamp = (time) => {
        if (!time || !time.toDate) return "";
        const dateObj = new Date(time.toDate());
        return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
    };

    const prepareReport = async (number) => {
        setReportNumber(number);
        const detailReport = await fetchReportItems(number);
        
        let headerReport = spbList.find((e) => e.id == number);
        if (!headerReport) {
            const q = query(sjHeaderRef, where("id", "==", parseInt(number)));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                headerReport = snapshot.docs[0].data();
            }
        }
        
        setReportDetailPrint(detailReport);
        setReportHeaderPrint(headerReport);
        setShowReport(true);
    };

    const downloadReport = async (e) => {
        e.stopPropagation(); 
        const id = e.currentTarget.id;
        await prepareReport(id);
        
        const reportType = spbList.find(r => r.id == id)?.spbType || "Report";
        const getTargetElement = () => document.getElementById("output-report");
        
        const options = {
            filename: `${reportType}${id}.pdf`,
            method: "save",
            resolution: Resolution.MEDIUM,
            page: { margin: Margin.SMALL, format: "A4", orientation: "portrait" },
            canvas: { mimeType: "image/jpeg", qualityRatio: 1 },
            overrides: { pdf: { compress: true }, canvas: { useCORS: true } },
        };
        
        setTimeout(() => {
            generatePDF(getTargetElement, options);
            setTimeout(() => setShowReport(false), 200);
        }, 1000);
    };

    const printReport = async (e) => {
        e.stopPropagation(); 
        const id = e.currentTarget.id;
        await prepareReport(id);
        
        setTimeout(() => {
            handlePrint();
            setShowReport(false);
        }, 1000);
    };

    // --- Initial Loader ---
    if (loading && spbList.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
                    <p className="mt-4 text-lg text-indigo-600 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    // --- Render HTML ---
    return (
        <div className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
            <div className="container mx-auto max-w-7xl">
                
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800 border-b-2 border-indigo-500 pb-2">
                        Surat Pengiriman Barang
                    </h1>
                    <p className="text-gray-500 mb-6">SM Department Site BRCG - Dashboard</p>

                    <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 transition-all duration-300">
                        
                        {/* ACTION & SEARCH BAR */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
                            
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => navigate("/input")}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
                                >
                                    <i className="fa fa-plus-circle"></i> Create New
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
                                >
                                    <i className="fa fa-file-excel"></i> Export Excel
                                </button>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search No Surat, Tujuan, Nopol, or Item..."
                                        className="w-full md:w-80 pl-4 pr-10 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 transition duration-200"
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={handleClearSearch}
                                            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                            title="Clear Search"
                                        >
                                            <i className="fa fa-times"></i>
                                        </button>
                                    )}
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-lg disabled:opacity-50 transition duration-200"
                                    title="Search"
                                >
                                    <i className="fa fa-search"></i>
                                </button>
                            </div>
                        </div>

                        {/* TABLE container */}
                        <div
                            ref={tableContainerRef}
                            className="overflow-y-auto max-h-[60vh] border border-gray-200 rounded-lg shadow-inner"
                        >
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr>
                                        {[
                                            "No Surat",
                                            "Tanggal",
                                            "Kategori",
                                            "Tujuan",
                                            "Pengirim",
                                            "Nomor Polisi",
                                            "Dibuat Oleh",
                                            "Action",
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="sticky top-0 bg-gray-100 p-2 font-semibold uppercase text-xs text-gray-700 border-b border-gray-300 text-left shadow-sm z-10"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={8} className="p-10 text-center">
                                                <div className="flex justify-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {spbList.map((item) => {
                                                const isRowExpanded = expandedRowIds.has(item.id);
                                                return (
                                                    <React.Fragment key={item.id}>
                                                        <tr 
                                                            onClick={() => toggleRow(item.id)}
                                                            className={`border-b border-gray-100 transition duration-150 cursor-pointer 
                                                                        ${isRowExpanded ? 'bg-indigo-50/70 border-b-indigo-200' : 'hover:bg-indigo-50/50'}`}
                                                        >
                                                            <td className="p-2 text-center font-medium text-gray-800">{item.id}</td>
                                                            <td className="p-2 text-center text-gray-600">{parseTimestamp(item.tglSuratJalan)}</td>
                                                            <td className="p-2 text-center text-gray-600">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.spbType === 'SPB' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                                    {item.spbType}
                                                                </span>
                                                            </td>
                                                            <td className="p-2 text-left text-gray-600">{item.tujuan}</td>
                                                            <td className="p-2 text-left text-gray-600">{item.ekspedisi}</td>
                                                            <td className="p-2 text-center text-gray-600 font-mono">{item.nopol}</td>
                                                            <td className="p-2 text-center text-gray-600 text-sm">{item.creator}</td>
                                                            <td className="p-2 text-center">
                                                                <div className="flex justify-center gap-3 items-center">
                                                                    <span 
                                                                        className={`text-blue-600 transition duration-150 transform ${isRowExpanded ? 'rotate-180' : 'rotate-0'}`} 
                                                                        title={isRowExpanded ? "Collapse" : "Expand"}
                                                                    >
                                                                        <i className="fa fa-chevron-down"></i>
                                                                    </span>
                                                                    
                                                                    <button id={item.id} onClick={downloadReport} className="text-green-600 hover:text-green-800 transition duration-150" title="Download PDF"><i className="fa fa-download"></i></button>
                                                                    <button id={item.id} onClick={printReport} className="text-gray-600 hover:text-gray-800 transition duration-150" title="Print Hardcopy"><i className="fa fa-print"></i></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        
                                                        <DetailRow
                                                            key={`detail-${item.id}`}
                                                            headerId={item.id}
                                                            fetchItems={fetchReportItems}
                                                            isExpanded={isRowExpanded} 
                                                            searchTerm={searchTerm} // Meneruskan searchTerm
                                                        />
                                                    </React.Fragment>
                                                );
                                            })}

                                            {spbList.length === 0 && !loading && (
                                                <tr>
                                                    <td colSpan={8} className="p-10 text-center text-gray-500 font-medium">
                                                        {isSearching ? "No records found for the search query." : "No records available."}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION & INFO */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t mt-4">
                            
                            <span className="text-sm text-gray-500 font-medium">
                                Showing {spbList.length} records. 
                                Total: <span className="font-semibold text-gray-700">{totalRecords}</span> documents.
                            </span>
                            
                            {!isSearching && (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-600 font-semibold">
                                        Page {currentPage} of {totalPages || 1}
                                    </span>
                                    
                                    <button
                                        onClick={fetchPrevPage}
                                        disabled={currentPage === 1 || loading}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 transition duration-200 font-medium"
                                        title="Previous Page"
                                    >
                                        <i className="fa fa-arrow-left"></i> Prev
                                    </button>
                                    
                                    <button
                                        onClick={fetchNextPage}
                                        disabled={currentPage === totalPages || totalPages === 0 || loading || spbList.length < recordsPerPage}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition duration-200 font-medium"
                                        title="Next Page"
                                    >
                                        Next <i className="fa fa-arrow-right"></i>
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {showReport && (
                <div id="output-report" className="document__container">
                    <HardcopyTemplate header={reportHeaderPrint} detail={reportDetailPrint} ref={componentRef} />
                </div>
            )}
        </div>
    );
};

export default Homepage;