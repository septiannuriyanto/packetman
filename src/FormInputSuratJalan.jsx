import { useState, useRef, useEffect } from "react";
import "./App.css";
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css' // Import css

import { doc, setDoc, addDoc, } from "firebase/firestore";

import { query, orderBy, limit } from "firebase/firestore";
import { collection, onSnapshot } from "firebase/firestore";
import { db, sjHeaderRef } from "./FirebaseConfig";
import { useNavigate } from "react-router-dom";


const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']



function App() {

  const navigate = useNavigate();

  //SPB Variable Hook Declaration
  const [spbtype, setSpbType] = useState('SPB');
  const [noSurat, setNoSurat] = useState(0);
  const [creator, setCreator] = useState('');
  const [pengawas, setPengawas] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [kota, setKota] = useState('');
  const [ekspedisi, setEkspedisi] = useState('');
  const [nopol, setNopol] = useState('');
  var tglSurat = new Date();
  var dateString = tglSurat.getDate() + " " + months[tglSurat.getMonth()] + " " + tglSurat.getFullYear();

  //SPB Object Hook Declaration
  const [spbheader, setspbheader] = useState(null);
  const [spbitems, setspbitems] = useState([]);

  //Item variable Hook Declaration
  const inputItemRef = useRef(null);
  const [arrayId, setArrayId] = useState(null);
  const [namabarang, setNamaBarang] = useState('');
  const [qty, setQty] = useState('');
  const [satuan, setSatuan] = useState('');
  const [referensi, setReferensi] = useState('');
  const [editMode, setEditMode] = useState(false);

  const fetchId = async () => {

    const q = query(sjHeaderRef, orderBy('id', 'desc'), limit(3));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {

      setNoSurat(querySnapshot.docs[0].get('id') + 1);
      setTimeout(() => {

      }, 2000);
      console.log('Next No Surat : ' + noSurat);
    });
    return () => {
      unsubscribe();
    }

  }


  useEffect(() => {
    fetchId();

  },)


  function validasi(name, value) {
    if (value === '') {
      return name
    }
    else {
      return '';
    }

  }


  function createSPB(e) {
    e.preventDefault();
    if (validasi("creator", creator) !== '') return alert(validasi("creator", creator) + ' belum diisi');
    if (validasi("pengawas", pengawas) !== '') return alert(validasi("pengawas", pengawas) + ' belum diisi');
    if (validasi("tujuan", tujuan) !== '') return alert(validasi("tujuan", tujuan) + ' belum diisi');
    if (validasi("kota", kota) !== '') return alert(validasi("kota", kota) + ' belum diisi');
    if (validasi("ekspedisi", ekspedisi) !== '') return alert(validasi("ekspedisi", ekspedisi) + ' belum diisi');
    if (validasi("nopol", nopol) !== '') return alert(validasi("nopol", nopol) + ' belum diisi');

    var header = {
      "id": noSurat,
      "tglSuratJalan": tglSurat,
      "spbType": spbtype,
      "creator": creator,
      "pengawas": pengawas,
      "tujuan": tujuan,
      "kota": kota,
      "ekspedisi": ekspedisi,
      "nopol": nopol,
      "isApproved": false,
      "approvedBy": null,
      "isReceived": false,
      "receivedBy": null,
      "receivedDate": null,
    }



    setspbheader(header);


  }

  function onHandleAdd(e) {
    e.preventDefault();
    if (validasi("Nama Barang", namabarang) !== '') return alert(validasi("Nama Barang", namabarang) + ' belum diisi');
    if (validasi("Qty", qty) !== '') return alert(validasi("Qty", qty) + ' belum diisi');
    if (validasi("Satuan", satuan) !== '') return alert(validasi("Satuan", satuan) + ' belum diisi');
    if (validasi("Referensi", referensi) !== '') return alert(validasi("Referensi", referensi) + ' belum diisi');

    var newItem = {
      "idSurat": noSurat,
      "id": spbitems.length,
      "namaBarang": namabarang,
      "qty": qty,
      'satuan': satuan,
      "referensi": referensi
    }

    setspbitems([...spbitems, newItem])
    console.log('Item Added');

    setNamaBarang('');
    setQty('');
    setSatuan('');
    setReferensi('');

    inputItemRef.current.focus()

  }

  const onOptionChange = e => {
    setSpbType(e.target.value)
  }

  //Done
  const removeItem = (e) => {
    e.preventDefault();
    var newArr = spbitems.filter((item) => item.id != e.target.id)
    console.log(newArr);
    setspbitems(newArr);

  }
  const editItem = (e) => {
    console.log(e.target.id);
    console.log(spbitems)
    e.preventDefault();
    setEditMode(true);
    var newArr = spbitems.filter((item) => item.id == e.target.id);

    setArrayId(newArr[0].id)
    setNamaBarang(newArr[0].namaBarang);
    setQty(newArr[0].qty);
    setSatuan(newArr[0].satuan);
    setReferensi(newArr[0].referensi);
  }
  const finishEditItem = (e) => {
    e.preventDefault();
    const updatedArray = spbitems.map((item) => {
      if (item.id == arrayId) {
        return { item, id: arrayId, namaBarang: namabarang, qty: qty, satuan: satuan, referensi: referensi }
      } else {
        return item;
      }
    });
    setspbitems(updatedArray);

    //RESET ITEMS
    setEditMode(false);
    setNamaBarang('');
    setQty('');
    setSatuan('');
    setReferensi('');
    inputItemRef.current.focus()
  }

  const submitConfirmation = (e) => {
    e.preventDefault();
    confirmAlert({
      title: 'Konfirmasi',
      message: 'Yakin submit surat jalan ini?',
      buttons: [
        {
          label: 'Yes',
          onClick: async () => {
            await setDoc(doc(db, "surat_jalan", noSurat.toString()), spbheader);
            spbitems.map(async (item) => {
              await addDoc(collection(db, "surat_jalan_items"), item);
            });
            resetAllForm();
          }
        },
        {
          label: 'No',
        }
      ]
    })
  };

  const resetAllForm = () => {
    navigate('/')
    alert('Surat Jalan Berhasil Dibuat')
    

    //Object
    // setspbheader(null);
    // setspbitems([]);
    // setEditMode(false);



    //Header
    // setSpbType('SPB');
    // setCreator('');
    // setPengawas('');
    // setTujuan('');
    // setKota('');
    // setEkspedisi('');
    // setNopol('');

    //Items
    // setArrayId(null);
    // setNamaBarang('');
    // setQty('');
    // setSatuan('');
    // setReferensi('');


  }




  return (
    <div className="min-h-screen p-6 bg-gray-100 flex items-center justify-center">
      <div className="container max-w-screen-lg mx-auto">
        <div>
          <h2 className="font-semibold text-xl text-gray-600">
            Form Pengiriman Barang
          </h2>
          <p className="text-gray-500 mb-6">SM Department Site BRCG</p>
          

          <div className="bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6">
            <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
              <div className="text-gray-600">
                <p className="font-medium text-lg">Surat Jalan # {noSurat} </p>
                <p>Tanggal : {dateString}</p>
                <button onClick={() => navigate('/')} className="mt-2 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded mb-2">
            List Surat Jalan
          </button>
              </div>
              

              <form onSubmit={createSPB} className="lg:col-span-2">
                <main className="grid h-20  place-items-center">
                  <div className="grid w-full grid-cols-2 gap-2 rounded-xl bg-gray-200 p-2">
                    <div>
                      <input
                        type="radio"
                        name="option"
                        id="1"
                        value="SPB"
                        className="peer hidden"
                        checked={spbtype === 'SPB'}
                        onChange={onOptionChange}

                      />
                      <label
                        htmlFor="1"
                        className=" block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-blue-500 peer-checked:font-bold peer-checked:text-white"
                      >
                        SPB
                      </label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        name="option"
                        id="2"
                        value="TT"
                        className="peer hidden"
                        checked={spbtype === 'TT'}
                        onChange={onOptionChange}
                      />
                      <label
                        htmlFor="2"
                        className=" block cursor-pointer select-none rounded-xl p-2 text-center peer-checked:bg-green-500 peer-checked:font-bold peer-checked:text-white"
                      >
                        Tanda Terima
                      </label>
                    </div>
                  </div>
                </main>
                <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
                  <div className="md:col-span-3">
                    <label htmlFor="creator">Dibuat Oleh</label>
                    <input
                      disabled={spbheader}
                      onChange={(e) => setCreator(e.target.value)}
                      type="text"
                      name="creator"
                      id="creator"
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      placeholder=""
                      value={creator}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pengawas">Pengawas</label>
                    <input
                      disabled={spbheader}
                      onChange={(e) => setPengawas(e.target.value)}
                      type="text"
                      name="pengawas"
                      id="pengawas"
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      placeholder=""
                      value={pengawas}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor="tujuan">Tujuan</label>
                    <input
                      disabled={spbheader}
                      onChange={(e) => setTujuan(e.target.value)}
                      type="text"
                      name="tujuan"
                      id="tujuan"
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      placeholder=""
                      value={tujuan}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="kota">Kota</label>
                    <div className="h-10 bg-gray-50 flex border border-gray-200 rounded items-center mt-1">
                      <input
                        disabled={spbheader}
                        onChange={(e) => setKota(e.target.value)}
                        name="kota"
                        id="kota"
                        placeholder="Kota"
                        className="px-4 appearance-none outline-none text-gray-800 w-full bg-transparent"
                        value={kota}
                      />
                      <button
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
                        tabIndex="-1"
                        htmlFor="show_more"
                        className="cursor-pointer outline-none focus:outline-none border-l border-gray-200 transition-all text-gray-300 hover:text-blue-600"
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
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label htmlFor="ekspedisi">Pengirim / Ekspedisi</label>
                    <div className="h-10 bg-gray-50 flex border border-gray-200 rounded items-center mt-1">
                      <input
                        disabled={spbheader}
                        onChange={(e) => setEkspedisi(e.target.value)}
                        name="ekspedisi"
                        id="ekspedisi"
                        placeholder="Pengirim / Ekspedisi"
                        className="px-4 appearance-none outline-none text-gray-800 w-full bg-transparent"
                        value={ekspedisi}
                      />
                      <button
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
                        tabIndex="-1"
                        htmlFor="show_more"
                        className="cursor-pointer outline-none focus:outline-none border-l border-gray-200 transition-all text-gray-300 hover:text-blue-600"
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
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="nopol">Nomor Polisi</label>
                    <div className="h-10 bg-gray-50 flex border border-gray-200 rounded items-center mt-1">
                      <input
                        disabled={spbheader}
                        onChange={(e) => setNopol(e.target.value)}
                        name="nopol"
                        id="nopol"
                        placeholder="Nomor Polisi"
                        className="px-4 appearance-none outline-none text-gray-800 w-full bg-transparent"
                        value={nopol}
                      />
                      <button
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
                        tabIndex="-1"
                        htmlFor="show_more"
                        className="cursor-pointer outline-none focus:outline-none border-l border-gray-200 transition-all text-gray-300 hover:text-blue-600"
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
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-5 text-right">
                    <div className="inline-flex items-end">
                      {spbheader ? <div></div> : <button disabled={spbheader} type="submit" className={`${spbtype === `SPB` ? `bg-blue-500 hover:bg-blue-700` : `bg-green-500 hover:bg-green-700`} disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded`}>
                        Create Header
                      </button>}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {spbheader === null ? <div></div> :
              <div className="input__panel">
                <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <label htmlFor="input_namabarang">Nama Barang</label>
                    <input
                      ref={inputItemRef}
                      onChange={(e) => setNamaBarang(e.target.value)}
                      type="text"
                      name="input_namabarang"
                      id="input_namabarang"
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      value={namabarang}
                      placeholder=""
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="input_qty">Qty</label>
                    <input
                      onChange={(e) => setQty(e.target.value)}
                      type="text"
                      name="input_qty"
                      id="input_qty"
                      value={qty}
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"

                      placeholder=""
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="input_satuan">Satuan</label>
                    <div className="h-10 bg-gray-50 flex border border-gray-200 rounded items-center mt-1">
                      <input
                        onChange={(e) => setSatuan(e.target.value)}
                        name="input_satuan"
                        id="input_satuan"
                        placeholder="Satuan"
                        className="px-4 appearance-none outline-none text-gray-800 w-full bg-transparent"
                        value={satuan}

                      />
                      <button
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
                        tabIndex="-1"
                        htmlFor="show_more"
                        className="cursor-pointer outline-none focus:outline-none border-l border-gray-200 transition-all text-gray-300 hover:text-blue-600"
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
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="input_referensi">Referensi</label>
                    <input
                      onChange={(e) => setReferensi(e.target.value)}
                      type="text"
                      name="input_referensi"
                      id="input_referensi"
                      className="h-10 border mt-1 rounded px-4 w-full bg-gray-50"
                      value={referensi}
                      placeholder=""
                    />
                  </div>
                </div>
                {editMode ?
                  <div className="md:col-span-5 text-right mt-2">
                    <div className="inline-flex items-end">
                      <button onClick={finishEditItem} className="bg-cyan-700 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">
                        Finish Edit
                      </button>
                    </div>
                  </div>

                  : <div className="md:col-span-5 text-right mt-2">
                    <div className="inline-flex items-end">
                      <button onClick={onHandleAdd} className={`${spbtype === `SPB` ? `bg-blue-500 hover:bg-blue-700` : `bg-green-500 hover:bg-green-700`} disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded`}>
                        Add Item
                      </button>
                    </div>
                  </div>}
              </div>
            }


            {/* Table */}
            <table className="border-collapse w-full mt-10">
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
                  <th className="p-3 font-bold uppercase bg-gray-200 text-gray-600 border border-gray-300 hidden lg:table-cell">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>

                {spbitems.map((item) => (
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
                    <td className="w-full lg:w-auto p-3 text-gray-800 border border-b text-center block lg:table-cell relative lg:static">
                      <span className="lg:hidden absolute top-0 left-0 bg-blue-200 px-2 py-1 text-xs font-bold uppercase">
                        Action
                      </span>
                      <a
                        id={item.id}
                        onClick={editItem}
                        href="#"
                        className="text-blue-400 hover:text-blue-600 underline"
                      >
                        Edit
                      </a>
                      <a
                        id={item.id}
                        onClick={removeItem}
                        href="#"
                        className="text-blue-400 hover:text-blue-600 underline pl-6"
                      >
                        Remove
                      </a>
                    </td>
                  </tr>

                ))}



              </tbody>
            </table>
            {/* End Table */}
            {spbitems.length > 0 ? <div className="flex justify-center text-right mt-10">
              <div className="inline-flex items-center">
                <button onClick={submitConfirmation} className={`${spbtype === `SPB` ? `bg-blue-500 hover:bg-blue-700` : `bg-green-500 hover:bg-green-700`} disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded`}>
                  Submit Surat Jalan
                </button>
              </div>
            </div> : <div></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
