import { useEffect, useState } from "react";

const Modal = ({ reportData, showModal, setModal }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    setTimeout(() => {}, 200);
    setData(reportData);
  }, [reportData]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showModal) {
        setModal(false);
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showModal, setModal]);

  // Handle backdrop click (click outside modal)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setModal(false);
    }
  };

  return (
    <>
      {showModal === true ? (
        <>
          <div
            className="bg-slate-500 bg-opacity-50 flex justify-center items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
            onClick={handleBackdropClick} // Close when clicking backdrop
          >
            <div 
              className="relative w-3/4 my-6 mx-auto"
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
              <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                <div className="flex items-start justify-between p-5 border-b border-solid border-gray-300 rounded-t ">
                  <h3 className="text-xl font-semibold">Detail Item # </h3>
                  <button
                    className="bg-transparent border-0 text-black float-right"
                    onClick={() => setModal(false)}
                  >
                    <span className="text-black opacity-7 h-6 w-6 text-2xl block hover:bg-red-100 rounded-full flex items-center justify-center">
                      ×
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
                      {data ? (
                        data.map((item) => (
                          <tr
                            key={item.id}
                            className="bg-white lg:hover:bg-gray-100 flex lg:table-row flex-row lg:flex-row flex-wrap lg:flex-no-wrap mb-10 lg:mb-0"
                          >
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
                              <span className="">{item.satuan}</span>
                            </td>
                            <td className="w-full lg:w-auto p-3 text-gray-800 text-center border border-b block lg:table-cell relative lg:static">
                              <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                                Referensi
                              </span>
                              {item.referensi}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-gray-500">
                            No Data
                          </td>
                        </tr>
                      )}
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