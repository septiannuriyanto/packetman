import { useState, useEffect, useRef } from "react"
import { sjHeaderRef } from "./FirebaseConfig";
import { query, orderBy, } from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";
import { sjDetailRef } from "./FirebaseConfig";
import { getDocs, where } from "firebase/firestore";

import { useReactToPrint } from 'react-to-print';
import HardcopyTemplate from "./HardcopyTemplate";
import generatePDF, { Resolution, Margin } from 'react-to-pdf';


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

  const fetchId = async () => {

    const q = query(sjHeaderRef, orderBy('id', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setSPBList(querySnapshot.docs);

    });
    return () => {
      unsubscribe();
    }

  }

  const fetchReportItems = async (id) => {

    var dataReport = [];
    const q = query(sjDetailRef, where('idSurat', "==", parseInt(id)));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      dataReport.push(doc.data());
    });

    return dataReport;
  }


  useEffect(() => {
    fetchId();

  },)


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

  const downloadReport  = async (e) => {
    e.preventDefault();
    setTimeout(() => {
        setShowReport(true);
    }, 1000);
    var reportType = spbList[e.target.id].get('spbType');

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


  const returnData = (data) => {

    return data.data();
  }

  const prepareReport = async (number) => {
    setReportNumber(number);
    const headerData = spbList.map(returnData);
    const detailReport = await fetchReportItems(number);
    const headerReport = headerData.find((e) => e.id == number)
    setReportDetailPrint(detailReport)
    setReportHeaderPrint(headerReport)
  }

  const printReport = async (e) => {
    e.preventDefault();
    setTimeout(() => {
      setShowReport(true)
    }, 1000);
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
                <div className="inline-flex items-end">
                  <button onClick={() => navigate('/input')} className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded mb-2">
                    Create New...
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
                    var item = data.data();
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
      
      <div className="w-full sign flex flex-row text-center m-auto justify-center text-sm"><h4 className='font-thin'>Packetman app v 1.2 | Built by Scalar Coding </h4></div>
      {showReport==false? <div></div> : <div  className={`document__container`} >
            <HardcopyTemplate header={reportHeaderPrint} detail={reportDetailPrint} ref={componentRef} />
      </div>}
    </div>
  )
}

export default Homepage
