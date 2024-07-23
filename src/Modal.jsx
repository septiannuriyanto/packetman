import { useEffect, useState, } from "react";


const Modal = ({ reportData, showModal, setModal }) => {

  const [data, setData] = useState(null)

  useEffect(() => {

    setTimeout(() => {

    }, 200);
    setData(reportData);



  })


  return (
    <>
      {showModal == true ? (
        <>

          <div className="bg-slate-500 bg-opacity-50 flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="relative w-3/4 my-6 mx-auto">
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t ">
                  <h3 className="text-xl font=semibold">Detail Item # </h3>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => setModal(false)}
                  >
                    <span className="text-black opacity-7 h-4 w-4 text-xl block bg-red-600 py-0 rounded-full">

                    </span>
                  </button>
                </div>
                <div className="relative p-6 flex-auto">
                  {/* Table */}
                  <table className="border-collapse w-full">
                    <thead>
                      <tr>
                        <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                          Nama Barang
                        </th>
                        <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                          Qty
                        </th>
                        <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                          Satuan
                        </th>
                        <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                          Referensi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {

                      data? data.map((item) => (
                          <tr key={item.id} className="bg-white lg:hover:bg-gray-100 flex lg:table-row flex-row lg:flex-row flex-wrap lg:flex-no-wrap mb-10 lg:mb-0">
                            <td className="w-full lg:w-auto p-3 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                              <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                                Nama Barang
                              </span>
                              {item.namaBarang}
                            </td>
                            <td className="w-full lg:w-auto p-3 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                              <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                                Qty
                              </span>
                              {item.qty}
                            </td>
                            <td className="w-full lg:w-auto p-3 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                              <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                                Satuan
                              </span>
                              <span className="">
                                {item.satuan}
                              </span>
                            </td>
                            <td className="w-full lg:w-auto p-3 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                              <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                                Referensi
                              </span>
                              {item.referensi}
                            </td>

                          </tr>

                        )) : <tr>
                          <td>
                          <span>
                          No Data
                          </span>
                          </td>

                        </tr>

                      }
                    </tbody>
                  </table>

                </div>

              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
};

export default Modal;



