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
import Modal from "./Modal";
import { useReactToPrint } from "react-to-print";
import HardcopyTemplate from "./HardcopyTemplate";
import generatePDF, { Resolution, Margin } from "react-to-pdf";
import exportToExcel from "./ExcelConverter";

const Homepage = () => {
  const [reportHeaderPrint, setReportHeaderPrint] = useState(null);
  const [reportDetailPrint, setReportDetailPrint] = useState(null);
  const [spbList, setSPBList] = useState([]); // current page records
  const [reportData, setReportData] = useState(null);
  const [reportNumber, setReportNumber] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // cursor for pagination
  const [firstDoc, setFirstDoc] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  
  // search
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const navigate = useNavigate();
  const componentRef = useRef(null);
  const tableContainerRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // ---------- get total count ----------
  const getTotalCount = async () => {
    try {
      const snapshot = await getDocs(sjHeaderRef);
      setTotalRecords(snapshot.size);
    } catch (err) {
      console.error("Get total count error:", err);
    }
  };

  // ---------- fetch first page ----------
  const fetchFirstPage = async () => {
    setLoading(true);
    try {
      const q = query(
        sjHeaderRef, 
        orderBy("id", "desc"), 
        limit(recordsPerPage)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => d.data());
      
      setSPBList(data);
      setFirstDoc(snapshot.docs[0]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setCurrentPage(1);
    } catch (err) {
      console.error("Fetch first page error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- fetch next page ----------
  const fetchNextPage = async () => {
    if (!lastDoc) return;
    setLoading(true);
    try {
      const q = query(
        sjHeaderRef,
        orderBy("id", "desc"),
        startAfter(lastDoc),
        limit(recordsPerPage)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => d.data());
      
      if (data.length > 0) {
        setSPBList(data);
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setCurrentPage(prev => prev + 1);
        
        // reset scroll
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
      }
    } catch (err) {
      console.error("Fetch next page error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- fetch previous page ----------
  const fetchPrevPage = async () => {
    if (!firstDoc) return;
    setLoading(true);
    try {
      const q = query(
        sjHeaderRef,
        orderBy("id", "desc"),
        endBefore(firstDoc),
        limitToLast(recordsPerPage)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => d.data());
      
      if (data.length > 0) {
        setSPBList(data);
        setFirstDoc(snapshot.docs[0]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setCurrentPage(prev => prev - 1);
        
        // reset scroll
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = 0;
        }
      }
    } catch (err) {
      console.error("Fetch prev page error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- search function ----------
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // if search empty, reload first page
      handleClearSearch();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      // search in all fields
      const snapshot = await getDocs(sjHeaderRef);
      const allData = snapshot.docs.map((d) => d.data());
      
      const filtered = allData.filter((item) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.id?.toString().includes(searchLower) ||
          item.spbType?.toLowerCase().includes(searchLower) ||
          item.tujuan?.toLowerCase().includes(searchLower) ||
          item.ekspedisi?.toLowerCase().includes(searchLower) ||
          item.nopol?.toLowerCase().includes(searchLower) ||
          item.creator?.toLowerCase().includes(searchLower)
        );
      });

      setSPBList(filtered);
      setTotalRecords(filtered.length);
      setCurrentPage(1);
      
      // reset scroll
      if (tableContainerRef.current) {
        tableContainerRef.current.scrollTop = 0;
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    getTotalCount();
    fetchFirstPage();
  };

  useEffect(() => {
    getTotalCount();
    fetchFirstPage();
  }, []);

  // ---------- close modal on ESC key ----------
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  // ---------- helpers ----------
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  const parseTimestamp = (time) => {
    if (!time || !time.toDate) return "";
    const dateObj = new Date(time.toDate());
    return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
  };

  const fetchReportItems = async (id) => {
    try {
      const q = query(sjDetailRef, where("idSurat", "==", parseInt(id)));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => d.data());
      return data.sort((a, b) => a.id - b.id);
    } catch (err) {
      console.error("fetchReportItems error:", err);
      return [];
    }
  };

  const prepareReport = async (number) => {
    setReportNumber(number);
    const detailReport = await fetchReportItems(number);
    
    // fetch specific header if not in current page
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

  const viewItems = async (e) => {
    const id = e.currentTarget.id;
    const detailReport = await fetchReportItems(id);
    setShowModal(true);
    setReportData(detailReport);
  };

  const handleModalBackdropClick = (e) => {
    // close modal if clicking on backdrop (not the modal content)
    if (e.target === e.currentTarget) {
      setShowModal(false);
    }
  };

  const downloadReport = async (e) => {
    const id = e.currentTarget.id;
    // Tampilkan report agar bisa dicetak/download
    await prepareReport(id);
    
    const reportType = spbList.find(r => r.id == id)?.spbType || "Report";
    
    // Memberi waktu untuk render report sebelum generate PDF
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
      // Sembunyikan kembali report setelah download
      setTimeout(() => setShowReport(false), 200);
    }, 1000);
  };

  const printReport = async (e) => {
    const id = e.currentTarget.id;
    await prepareReport(id);
    
    // Memberi waktu untuk render report sebelum print
    setTimeout(() => {
      handlePrint();
      setShowReport(false);
    }, 1000);
  };

  // ---------- initial loader (lebih elegan) ----------
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

  // ---------- render ----------
  return (
    <div className="min-h-screen p-6 bg-gray-50 flex items-start justify-center">
      <div className="container mx-auto max-w-7xl">
        <Modal 
          reportData={reportData} 
          showModal={showModal} 
          setModal={setShowModal} 
          ind="10"
          onBackdropClick={handleModalBackdropClick}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 border-b-2 border-indigo-500 pb-2">
            Surat Pengiriman Barang
          </h1>
          <p className="text-gray-500 mb-6">SM Department Site BRCG - Dashboard</p>

          <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 transition-all duration-300">
            
            {/* ACTION & SEARCH BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
              
              {/* Action Buttons */}
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

              {/* Search Box */}
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search No Surat, Tujuan, Nopol..."
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

            {/* TABLE container with sticky header and cleaner borders */}
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
                        className="sticky top-0 bg-gray-100 p-3 font-semibold uppercase text-xs text-gray-700 border-b border-gray-300 text-left shadow-sm z-10"
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
                      {spbList.map((item) => (
                        <tr 
                          key={item.id} 
                          className="border-b border-gray-100 hover:bg-indigo-50/50 transition duration-150"
                        >
                          <td className="p-3 text-center font-medium text-gray-800">{item.id}</td>
                          <td className="p-3 text-center text-gray-600">{parseTimestamp(item.tglSuratJalan)}</td>
                          <td className="p-3 text-center text-gray-600">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.spbType === 'SPB' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {item.spbType}
                              </span>
                          </td>
                          <td className="p-3 text-left text-gray-600">{item.tujuan}</td>
                          <td className="p-3 text-left text-gray-600">{item.ekspedisi}</td>
                          <td className="p-3 text-center text-gray-600 font-mono">{item.nopol}</td>
                          <td className="p-3 text-center text-gray-600 text-sm">{item.creator}</td>
                          <td className="p-3 text-center">
                            <div className="flex justify-center gap-3">
                              <button id={item.id} onClick={viewItems} className="text-blue-600 hover:text-blue-800 transition duration-150" title="View Items"><i className="fa fa-eye"></i></button>
                              <button id={item.id} onClick={downloadReport} className="text-green-600 hover:text-green-800 transition duration-150" title="Download PDF"><i className="fa fa-download"></i></button>
                              <button id={item.id} onClick={printReport} className="text-gray-600 hover:text-gray-800 transition duration-150" title="Print Hardcopy"><i className="fa fa-print"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}

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