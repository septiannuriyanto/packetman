import { useState, useEffect, useRef } from "react"
import { sjHeaderRef } from "./FirebaseConfig";
import { query, orderBy, limit } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { sjDetailRef } from "./FirebaseConfig";
import { getDocs, where } from "firebase/firestore";

import { useReactToPrint } from 'react-to-print';
import HardcopyTemplate from "./HardcopyTemplate";
import generatePDF, { Resolution, Margin } from 'react-to-pdf';
import exportToExcel from "./ExcelConverter";


const Homepage = () => {

  const [reportHeaderPrint, setReportHeaderPrint] = useState(null)
  const [reportDetailPrint, setReportDetailPrint] = useState(null)
  const [spbList, setSPBList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [reportNumber, setReportNumber] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const q = query(sjHeaderRef, orderBy('id', 'desc'));
  const dataSPB = [];

  const fetchReportItems = async (id) => {
    var dataReport = [];
    const q = query(sjDetailRef, where('idSurat', "==", parseInt(id)));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      dataReport.push(doc.data());
    });
    dataReport.sort((a, b) => a.id - b.id)
    return dataReport;
  }


  useEffect(() => {
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      querySnapshot.forEach((doc) => {
        dataSPB.push({
          ...doc.data(), doc,
        });
      });
    });
    return unsubscribe;

  },)

  useEffect(() => {
    setTimeout(() => {
      console.log('Loading data')
      setSPBList(dataSPB);
    }, 3000);


  }, [])




  const parseTimestamp = (time) => {

    const timeObj = new Date(time.toDate());
    const date = timeObj.getDate();
    const month = timeObj.getMonth();
    const year = timeObj.getFullYear();

    const dateString = `${date}/${month}/${year}`;
    return dateString;
  }

  const viewItems = async (e) => {
    e.preventDefault();
    const detailReport = await fetchReportItems(e.target.id);
    setShowModal(true);
    setReportData(detailReport)
  }

  const downloadReport = async (e) => {
    e.preventDefault();
    setTimeout(() => {
      setShowReport(true);
    }, 1000);

    console.log(e.target.id);

    var reportType = spbList[e.target.id].spbType;
    await prepareReport(e.target.id);
    const getTargetElement = () => document.getElementById("output-report");

    const options = {
      filename: `${reportType}${e.target.id}.pdf`,
      // default is `save`
      method: 'save',
      // default is Resolution.MEDIUM = 3, which should be enough, higher values
      // increases the image quality but also the size of the PDF, so be careful
      // using values higher than 10 when having multiple pages generated, it
      // might cause the page to crash or hang.
      resolution: Resolution.MEDIUM,
      page: {
        // margin is in MM, default is Margin.NONE = 0
        margin: Margin.SMALL,
        // default is 'A4'
        format: 'A4',
        // default is 'portrait'
        orientation: 'portrait',
      },
      canvas: {
        // default is 'image/jpeg' for better size performance
        mimeType: 'image/jpeg',
        qualityRatio: 1
      },
      // Customize any value passed to the jsPDF instance and html2canvas
      // function. You probably will not need this and things can break, 
      // so use with caution.
      overrides: {
        // see https://artskydj.github.io/jsPDF/docs/jsPDF.html for more options
        pdf: {
          compress: true
        },
        // see https://html2canvas.hertzen.com/configuration for more options
        canvas: {
          useCORS: true
        }
      },
    };

    e.preventDefault();
    setTimeout(() => {
      generatePDF(getTargetElement, options)
    }, 1000);

    setTimeout(() => {
      setShowReport(false);
    }, 1000);

  }


  const prepareReport = async (number) => {
    setReportNumber(number);
    const detailReport = await fetchReportItems(number);
    const headerReport = spbList.find((e) => e.id == number)
    setReportDetailPrint(detailReport)
    setReportHeaderPrint(headerReport)
    setShowReport(true)
    setTimeout(() => {

    }, 1000);

  }

  const printReport = async (e) => {
    e.preventDefault();


    const indx = e.target.id;

    prepareReport(indx);
    setTimeout(() => {
      handleStates();
      setShowReport(false)
    }, 1000);


  }
  const handleStates = () => {
    handlePrint();

  }

  const [searchQuery, setSearchQuery] = useState("");


  const deleteSearch = (e) => {
    e.preventDefault();
    setSearchQuery("");
  }

  const searchData = (e) => {
    e.preventDefault();

    if(searchQuery===""){
    console.log("Kosong")
    }
    else{
    console.log(searchQuery)
    }
    
  }

  return (
    <div>
      <Modal reportData={reportData} showModal={showModal} setModal={setShowModal} ind="10" />
      <div className="min-h-screen p-6 bg-gray-100 flex items-start justify-center">
        <div className="container mx-auto">
          <div>
            <h2 className="font-semibold text-xl text-gray-600">
              Daftar Pengiriman Barang
            </h2>
            <p className="text-gray-500 mb-6">SM Department Site BRCG</p>

            <div className="max-h-full max-w-full bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6 overflow-auto">
              <div className="md:col-span-5 text-right">


                <div className="md:grid md:grid-cols-5 md:col-span-5 content-between w-full m-auto justify-between py-2">

                  <div className="md:col-span-2">

                    <div className="h-10 bg-gray-50 flex border border-gray-200 rounded items-center mt-1">
                      <input

                        onChange={(e) => setSearchQuery(e.target.value)}
                        name="searchtext"
                        id="searchtext"
                        placeholder="Search"
                        className="px-4 appearance-none outline-none text-gray-800 w-full bg-transparent"
                        value={searchQuery}
                      />
                      <button
                        onClick={deleteSearch}
                        tabIndex="-1"
                        className="cursor-pointer outline-none focus:outline-none transition-all text-gray-300 hover:text-red-600"
                      >
                        <svg
                          className="w-4 h-4 mx-2 fill-current"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                      <button
                      onClick={(e)=> searchData(e)}
                        tabIndex="-1"
                        htmlFor="show_more"
                        className="cursor-pointer outline-none focus:outline-none border-l border-gray-200 transition-all text-gray-300 hover:text-blue-600"
                      >
                        <svg
                          className="w-4 h-4 mx-2"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8"></circle>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>


                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-1 sm:col-span-0"></div>

                  <button onClick={() => navigate('/input')} className=" sm:jus md:col-span-1 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-500 text-white font-bold px-4 rounded py-2 mx-1">
                    Create New...
                  </button>

                  <button onClick={exportToExcel} className=" sm:jus md:col-span-1 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-500 text-white font-bold px-4 rounded py-2 mx-1">
                    Export
                  </button>
                
                </div>


              </div>
              <table className="border-collapse w-full mt-1">
                <thead>
                  <tr>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      No Surat
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Tanggal
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Kategori
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Tujuan
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Pengirim
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Nomor Polisi
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Dibuat Oleh
                    </th>
                    <th className="sticky p-1 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {spbList.map((data) => {
                    var item = data
                    return (
                      <tr key={item.id} className="bg-white lg:hover:bg-gray-100 flex lg:table-row text-xs flex-row lg:flex-row flex-wrap lg:flex-no-wrap mb-10 lg:mb-0">
                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 py-1 text-xs font-bold uppercase">
                            No Surat
                          </span>
                          {item.id}
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            Tanggal
                          </span>
                          {
                            parseTimestamp(item.tglSuratJalan)

                          }
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            SPB Type
                          </span>
                          {item.spbType}
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            Tujuan
                          </span>
                          {item.tujuan}
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            Ekspedisi
                          </span>
                          {item.ekspedisi}
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            No Polisi
                          </span>
                          {item.nopol}
                        </td>

                        <td className="w-full lg:w-auto p-2 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                            Dibuat Oleh
                          </span>
                          {item.creator}
                        </td>

                        <td className="m-auto items-center justify-center w-full lg:w-auto p-2 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                          <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2  text-xs font-bold uppercase">
                            Action
                          </span>

                          <div className="inline-flex">
                            <a
                              id={item.id}
                              onClick={viewItems}
                              href="#"
                              className="fa fa-search text-blue-400 hover:text-blue-600 size-8"
                            >
                            </a>
                            <a
                              id={item.id}
                              onClick={downloadReport}
                              href="#"
                              className="fa fa-download text-blue-400 hover:text-blue-600 size-8"
                            >

                            </a>

                            <a
                              id={item.id}
                              onClick={printReport}
                              href="#"
                              className="fa fa-print text-blue-400 hover:text-blue-600 size-8"
                            >

                            </a>

                          </div>

                          {/* <a
                            id={item.id}
                            href="#"
                            className=" text-blue-400 hover:text-blue-600 underline px-1">
                            View
                          </a>

                          <a
                            id={item.id}
                            href="#"
                            className="text-blue-400 hover:text-blue-600 underline px-1">
                            Download
                          </a>

                          <a
                            id={item.id}

                            href="#"
                            className="text-blue-400 hover:text-blue-600 underline px-1">
                            Print
                          </a> */}


                        </td>

                      </tr>

                    );

                  })}

                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full sign flex flex-row text-center m-auto justify-center text-sm"><h4 className='font-thin'>Packetman app v 1.6 | Built by Scalar Coding </h4></div>
      {showReport == false ? <div></div> : <div className={`document__container`} >
        <HardcopyTemplate header={reportHeaderPrint} detail={reportDetailPrint} ref={componentRef} />
      </div>}
    </div>
  )
}

export default Homepage
