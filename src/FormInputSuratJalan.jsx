import React, { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css' // Import css

import { doc, setDoc, addDoc, query, orderBy, limit, collection, onSnapshot } from "firebase/firestore";
import { db, sjHeaderRef } from "./FirebaseConfig";
import { useNavigate } from "react-router-dom";


const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// --- Icon Components (Penting di luar fungsi App untuk stabilitas) ---
const CheckIcon = () => <svg className="w-4 h-4 mr-1 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>;
const PlusIcon = () => <svg className="w-4 h-4 mr-1 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const SaveIcon = () => <svg className="w-4 h-4 mr-1 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>;

// ---------------------------------------------------------------------
// --- Optimized Input Field Components menggunakan React.memo ---------
// Ini mencegah re-render komponen input jika props-nya (value, onChange) tidak berubah.
// Ini adalah KUNCI untuk mengatasi masalah kehilangan fokus saat mengetik.
// ---------------------------------------------------------------------

const InputField = React.memo(({ label, id, value, onChange, disabled, placeholder = "" }) => (
    <div className="md:col-span-3">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            disabled={disabled}
            onChange={onChange}
            type="text"
            name={id}
            id={id}
            className={`h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            value={value}
        />
    </div>
));
InputField.displayName = 'InputField'; // Opsional, membantu debugging

const InputFieldSmall = React.memo(({ label, id, value, onChange, disabled, placeholder = "", inputRef }) => (
    <div className="md:col-span-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            ref={inputRef} // Hanya digunakan untuk input barang, aman
            disabled={disabled}
            onChange={onChange}
            type="text"
            name={id}
            id={id}
            className={`h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150 ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            value={value}
        />
    </div>
));
InputFieldSmall.displayName = 'InputFieldSmall'; // Opsional, membantu debugging


// ---------------------------------------------------------------------
// --- Main App Component ----------------------------------------------
// ---------------------------------------------------------------------

function App() {

  const navigate = useNavigate();

  // SPB Variable Hook Declaration
  const [spbtype, setSpbType] = useState('SPB');
  const [noSurat, setNoSurat] = useState(0);
  const [creator, setCreator] = useState('');
  const [pengawas, setPengawas] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [kota, setKota] = useState('');
  const [ekspedisi, setEkspedisi] = useState('');
  const [nopol, setNopol] = useState('');
  const [isHeaderValid, setIsHeaderValid] = useState(false); // Validasi untuk enable tombol
  
  const tglSurat = useRef(new Date()).current; // Gunakan useRef agar tanggal tidak berubah pada setiap render
  const dateString = tglSurat.getDate().toString().padStart(2, '0') + " " + months[tglSurat.getMonth()] + " " + tglSurat.getFullYear();

  // SPB Object Hook Declaration
  const [spbheader, setspbheader] = useState(null);
  const [spbitems, setspbitems] = useState([]);

  // Item variable Hook Declaration
  const inputItemRef = useRef(null);
  const [arrayId, setArrayId] = useState(null);
  const [namabarang, setNamaBarang] = useState('');
  const [qty, setQty] = useState('');
  const [satuan, setSatuan] = useState('');
  const [referensi, setReferensi] = useState('');
  const [editMode, setEditMode] = useState(false);

  // --- New: Effect for Header Validation (Keep this, it's correct) ---
  useEffect(() => {
    // Memastikan NOPOL tidak kosong (minimal 1 karakter) untuk mencegah validasi palsu dari spasi
    const isValid = [creator, pengawas, tujuan, kota, ekspedisi, nopol].every(field => field.trim() !== '');
    setIsHeaderValid(isValid);
  }, [creator, pengawas, tujuan, kota, ekspedisi, nopol]);


  const fetchId = useCallback(() => {
    // Referensi Firestore harus dijamin valid, diasumsikan sudah ada di FirebaseConfig
    const q = query(sjHeaderRef, orderBy('id', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const latestId = querySnapshot.docs.length > 0 ? querySnapshot.docs[0].get('id') : 0;
      setNoSurat(latestId + 1);
    }, (error) => {
        console.error("Error fetching latest ID:", error);
    });
    
    return () => unsubscribe();
  }, []); 


  useEffect(() => {
    // Hanya jalankan fetchId sekali saat komponen dimuat
    const unsubscribe = fetchId();
    return () => unsubscribe();

  }, [fetchId])


  // Helper function for simple input validation
  const validateInput = (name, value) => {
    return value.trim() === '' ? name + ' wajib diisi.' : '';
  }


  function createSPB(e) {
    e.preventDefault();
    
    // Check all fields
    const validationErrors = [
        validateInput("Dibuat Oleh", creator),
        validateInput("Pengawas", pengawas),
        validateInput("Tujuan", tujuan),
        validateInput("Kota", kota),
        validateInput("Pengirim/Ekspedisi", ekspedisi),
        validateInput("Nomor Polisi", nopol)
    ].filter(error => error !== '');

    if (validationErrors.length > 0) {
        return alert("Validasi Gagal:\n" + validationErrors.join('\n'));
    }

    const header = {
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
    alert(`Header Surat Jalan #${noSurat} Berhasil Dibuat. Silakan Tambahkan Barang.`);
  }

  function onHandleAdd(e) {
    e.preventDefault();
    const validationErrors = [
        validateInput("Nama Barang", namabarang),
        validateInput("Qty", qty),
        validateInput("Satuan", satuan),
        validateInput("Referensi", referensi)
    ].filter(error => error !== '');

    if (validationErrors.length > 0) {
        return alert("Validasi Gagal:\n" + validationErrors.join('\n'));
    }

    // Hitung ID lokal sementara
    const newLocalId = spbitems.length > 0 ? Math.max(...spbitems.map(item => item.id)) + 1 : 0; 

    var newItem = {
      "idSurat": noSurat,
      "id": newLocalId, // ID lokal sementara untuk manipulasi array
      "namaBarang": namabarang,
      "qty": qty,
      'satuan': satuan,
      "referensi": referensi
    }

    setspbitems((prevItems) => [...prevItems, newItem]);

    // Reset Item Form
    setNamaBarang('');
    setQty('');
    setSatuan('');
    setReferensi('');

    if (inputItemRef.current) inputItemRef.current.focus()
  }

  const onOptionChange = e => {
    setSpbType(e.target.value)
  }

  const removeItem = (e) => {
    e.preventDefault();
    const itemId = parseInt(e.currentTarget.id);
    confirmAlert({
      title: 'Hapus Item',
      message: 'Yakin ingin menghapus item ini?',
      buttons: [
        {
          label: 'Ya',
          onClick: () => {
            setspbitems((prevItems) => {
                const newArr = prevItems.filter((item) => item.id !== itemId);
                return newArr;
            });
            // If editing the removed item, exit edit mode
            if (editMode && arrayId === itemId) {
                setEditMode(false);
                setNamaBarang('');
                setQty('');
                setSatuan('');
                setReferensi('');
                setArrayId(null);
            }
          }
        },
        { label: 'Tidak' }
      ]
    });
  }

  const editItem = (e) => {
    e.preventDefault();
    const itemId = parseInt(e.currentTarget.id);
    setEditMode(true);
    const itemToEdit = spbitems.find((item) => item.id === itemId);

    if (itemToEdit) {
        setArrayId(itemToEdit.id)
        setNamaBarang(itemToEdit.namaBarang);
        setQty(itemToEdit.qty);
        setSatuan(itemToEdit.satuan);
        setReferensi(itemToEdit.referensi);
        if (inputItemRef.current) inputItemRef.current.focus();
    }
  }

  const finishEditItem = (e) => {
    e.preventDefault();
     const validationErrors = [
        validateInput("Nama Barang", namabarang),
        validateInput("Qty", qty),
        validateInput("Satuan", satuan),
        validateInput("Referensi", referensi)
    ].filter(error => error !== '');

    if (validationErrors.length > 0) {
        return alert("Validasi Gagal:\n" + validationErrors.join('\n'));
    }
    
    setspbitems((prevItems) => {
        return prevItems.map((item) => {
            if (item.id === arrayId) {
                return { 
                    ...item, // Keep other properties
                    id: arrayId, 
                    namaBarang: namabarang, 
                    qty: qty, 
                    satuan: satuan, 
                    referensi: referensi 
                }
            } else {
                return item;
            }
        });
    });

    // RESET ITEMS
    setEditMode(false);
    setNamaBarang('');
    setQty('');
    setSatuan('');
    setReferensi('');
    setArrayId(null);
    if (inputItemRef.current) inputItemRef.current.focus()
  }

  const submitConfirmation = (e) => {
    e.preventDefault();
    if (spbitems.length === 0) {
        return alert("Gagal: Harus ada minimal 1 item barang untuk disubmit.");
    }
    
    confirmAlert({
      title: 'Konfirmasi Submit Surat Jalan',
      message: `Yakin submit ${spbtype} #${noSurat}? Data tidak dapat diubah setelah disubmit.`,
      buttons: [
        {
          label: 'Ya, Submit',
          onClick: async () => {
            try {
              // 1. Submit Header
              await setDoc(doc(db, "surat_jalan", noSurat.toString()), spbheader);

              // 2. Submit Items (Hapus ID lokal sebelum dikirim)
              const itemsToSubmit = spbitems.map(({ id, ...rest }) => ({
                ...rest
              }));
              
              const itemCollectionRef = collection(db, "surat_jalan_items");
              
              await Promise.all(itemsToSubmit.map(item => {
                // Tambahkan 'idSurat' ke setiap item yang disubmit (sudah ada di itemsToSubmit)
                return addDoc(itemCollectionRef, item);
              }));

              // Reset the form after successful submission
              resetAllForm();
              
            } catch (error) {
              console.error("Error submitting surat jalan:", error);
              alert("Gagal Submit Surat Jalan: " + error.message);
            }
          },
          className: 'bg-indigo-600 hover:bg-indigo-700 text-white' // Custom class for styling
        },
        {
          label: 'Batal',
          className: 'bg-gray-300 hover:bg-gray-400' // Custom class for styling
        }
      ]
    });
  };


  const resetAllForm = () => {
    
    // Header
    setspbheader(null);
    setSpbType('SPB');
    setCreator('');
    setPengawas('');
    setTujuan('');
    setKota('');
    setEkspedisi('');
    setNopol('');
    
    // Items
    setspbitems([]);
    setEditMode(false);
    setArrayId(null);
    setNamaBarang('');
    setQty('');
    setSatuan('');
    setReferensi('');
    
    alert(`Surat Jalan #${noSurat} Berhasil Dibuat`);
    // Tunggu sampai ID baru ter-fetch sebelum navigasi, atau navigasi segera
    // Di sini, kita asumsikan ID baru sudah segera di-fetch di background
    navigate('/'); 
  }


  return (
    <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
      <div className="container max-w-screen-xl mx-auto">
        
        <header className="mb-6">
            <h1 className="text-3xl font-extrabold text-gray-800 border-b-2 border-indigo-500 pb-2">
                Form Pengiriman Barang
            </h1>
            <p className="text-gray-500 mt-1">SM Department Site BRCG - Isi detail surat jalan dan daftar barang.</p>
        </header>

        <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 mb-6">
            
            {/* --- HEADER SECTION --- */}
            <div className="grid gap-6 gap-y-4 text-sm grid-cols-1 lg:grid-cols-3 border-b pb-6 mb-6">
                
                {/* Info & Navigation */}
                <div className="text-gray-700 space-y-3">
                    <p className="font-extrabold text-2xl text-indigo-600">
                        Surat Jalan #{noSurat} 
                    </p>
                    <p className="text-base font-medium">Tanggal: <span className="text-gray-600">{dateString}</span></p>
                    
                    <button onClick={() => navigate('/')} className="mt-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition duration-200">
                        <i className="fa fa-list mr-2"></i> Kembali ke Daftar
                    </button>
                </div>
                
                {/* Form Header */}
                <form onSubmit={createSPB} className="lg:col-span-2 space-y-4">
                    
                    {/* SPB/TT Toggle */}
                    <div className="flex justify-center">
                        <div className="grid w-full max-w-sm grid-cols-2 rounded-xl p-1 shadow-inner bg-gray-100">
                            <div>
                                <input
                                    type="radio"
                                    name="option"
                                    id="spb_option"
                                    value="SPB"
                                    className="peer hidden"
                                    checked={spbtype === 'SPB'}
                                    onChange={onOptionChange}
                                    disabled={spbheader}
                                />
                                <label
                                    htmlFor="spb_option"
                                    className="block cursor-pointer select-none rounded-lg p-2 text-center text-sm font-semibold peer-checked:bg-indigo-600 peer-checked:text-white transition duration-200"
                                >
                                    SPB 
                                </label>
                            </div>
                            <div>
                                <input
                                    type="radio"
                                    name="option"
                                    id="tt_option"
                                    value="TT"
                                    className="peer hidden"
                                    checked={spbtype === 'TT'}
                                    onChange={onOptionChange}
                                    disabled={spbheader}
                                />
                                <label
                                    htmlFor="tt_option"
                                    className="block cursor-pointer select-none rounded-lg p-2 text-center text-sm font-semibold peer-checked:bg-green-600 peer-checked:text-white transition duration-200"
                                >
                                    Tanda Terima
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Header Fields */}
                    <div className="grid gap-4 gap-y-4 text-sm grid-cols-1 md:grid-cols-5">
                        
                        {/* PENTING: Gunakan InputField yang sudah di-memo */}
                        <InputField label="Dibuat Oleh" id="creator" value={creator} onChange={(e) => setCreator(e.target.value)} disabled={spbheader} placeholder="Nama Pembuat" />
                        <InputFieldSmall label="Pengawas" id="pengawas" value={pengawas} onChange={(e) => setPengawas(e.target.value)} disabled={spbheader} placeholder="Nama Pengawas" />

                        <InputField label="Tujuan Pengiriman" id="tujuan" value={tujuan} onChange={(e) => setTujuan(e.target.value)} disabled={spbheader} placeholder="Departemen/Lokasi Tujuan" />
                        <InputFieldSmall label="Kota Tujuan" id="kota" value={kota} onChange={(e) => setKota(e.target.value)} disabled={spbheader} placeholder="Cth: Balikpapan" />

                        <InputField label="Pengirim / Ekspedisi" id="ekspedisi" value={ekspedisi} onChange={(e) => setEkspedisi(e.target.value)} disabled={spbheader} placeholder="Nama Ekspedisi/Vendor" />
                        <InputFieldSmall label="Nomor Polisi" id="nopol" value={nopol} onChange={(e) => setNopol(e.target.value)} disabled={spbheader} placeholder="Cth: KT 1234 SM" />

                        {/* Create Header Button */}
                        <div className="md:col-span-5 text-right pt-2">
                            {spbheader ? 
                                <p className={`inline-flex items-center text-sm font-semibold p-2 rounded-lg ${spbtype === 'SPB' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                    <CheckIcon /> Header sudah dibuat! Lanjut tambah barang.
                                </p>
                                : 
                                <button 
                                    disabled={!isHeaderValid} 
                                    type="submit" 
                                    className={`${spbtype === `SPB` ? `bg-indigo-600 hover:bg-indigo-700` : `bg-green-600 hover:bg-green-700`} text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed`}
                                >
                                    <i className="fa fa-pen mr-2"></i> Simpan Header
                                </button>
                            }
                        </div>
                    </div>
                </form>
            </div>


            {/* --- ITEM INPUT SECTION --- */}
            {spbheader && (
              <div className="space-y-4 border-b pb-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Daftar Barang ({spbitems.length} Item)</h3>
                
                <div className="grid gap-4 gap-y-4 text-sm grid-cols-1 md:grid-cols-6">
                  
                  {/* Bagian Input Barang (di dalam component ini tidak perlu memo lagi karena hanya dirender ulang jika spbheader ada) */}
                  <div className="md:col-span-2">
                    <label htmlFor="input_namabarang" className="block text-sm font-medium text-gray-700">Nama Barang</label>
                    <input
                      ref={inputItemRef}
                      onChange={(e) => setNamaBarang(e.target.value)}
                      type="text"
                      name="input_namabarang"
                      id="input_namabarang"
                      className="h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                      value={namabarang}
                      placeholder="Cth: Baut M10"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="input_qty" className="block text-sm font-medium text-gray-700">Qty</label>
                    <input
                      // Hapus filter non-numeric jika Anda ingin Qty bisa berupa '1.5' atau '1/2'
                      onChange={(e) => setQty(e.target.value)} 
                      type="text"
                      name="input_qty"
                      id="input_qty"
                      value={qty}
                      className="h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                      placeholder="Jumlah"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label htmlFor="input_satuan" className="block text-sm font-medium text-gray-700">Satuan</label>
                    <input
                      onChange={(e) => setSatuan(e.target.value)}
                      name="input_satuan"
                      id="input_satuan"
                      placeholder="Cth: Pcs/Kg/Roll"
                      className="h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                      value={satuan}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="input_referensi" className="block text-sm font-medium text-gray-700">Referensi (Part No/Keterangan)</label>
                    <input
                      onChange={(e) => setReferensi(e.target.value)}
                      type="text"
                      name="input_referensi"
                      id="input_referensi"
                      className="h-10 border border-gray-300 mt-1 rounded-lg px-4 w-full bg-gray-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-150"
                      value={referensi}
                      placeholder="Cth: PN-456, No PO, dll"
                    />
                  </div>
                </div>
                
                {/* Item Action Button */}
                <div className="md:col-span-6 text-right pt-2">
                  <div className="inline-flex items-end">
                    {editMode ?
                      <button onClick={finishEditItem} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200">
                        <SaveIcon /> Selesai Edit Item
                      </button>
                      :
                      <button onClick={onHandleAdd} className={`${spbtype === `SPB` ? `bg-indigo-600 hover:bg-indigo-700` : `bg-green-600 hover:bg-green-700`} text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200`}>
                        <PlusIcon /> Tambah Item
                      </button>
                    }
                  </div>
                </div>
              </div>
            )}


            {/* --- ITEM LIST TABLE --- */}
            {spbheader && (
                <>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Ringkasan Barang ({spbitems.length} Item)</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-inner">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 font-bold uppercase text-xs text-gray-600 border-r border-gray-200 w-1/4 text-left">Nama Barang</th>
                        <th className="p-3 font-bold uppercase text-xs text-gray-600 border-r border-gray-200 w-1/12 text-center">Qty</th>
                        <th className="p-3 font-bold uppercase text-xs text-gray-600 border-r border-gray-200 w-1/12 text-center">Satuan</th>
                        <th className="p-3 font-bold uppercase text-xs text-gray-600 border-r border-gray-200 w-1/3 text-left">Referensi</th>
                        <th className="p-3 font-bold uppercase text-xs text-gray-600 w-1/6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>

                      {spbitems.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="p-6 text-center text-gray-500 italic">
                                Belum ada barang yang ditambahkan.
                            </td>
                        </tr>
                      ) : (
                        spbitems.map((item) => (
                          // PENTING: Key pada <tr> harus stabil, ID lokal sudah digunakan
                          <tr key={item.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition duration-150">
                            <td className="p-3 text-gray-800 text-left font-medium border-r border-gray-200">{item.namaBarang}</td>
                            <td className="p-3 text-gray-800 text-center border-r border-gray-200">{item.qty}</td>
                            <td className="p-3 text-gray-600 text-center border-r border-gray-200">{item.satuan}</td>
                            <td className="p-3 text-gray-600 text-left border-r border-gray-200 text-xs font-mono">{item.referensi}</td>
                            <td className="p-3 text-center">
                              <div className="flex justify-center gap-4">
                                <button
                                  id={item.id}
                                  onClick={editItem}
                                  className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  id={item.id}
                                  onClick={removeItem}
                                  className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                >
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end mt-6">
                  <button 
                    onClick={submitConfirmation} 
                    disabled={spbitems.length === 0}
                    className={`${spbtype === `SPB` ? `bg-indigo-600 hover:bg-indigo-700` : `bg-green-600 hover:bg-green-700`} text-white font-bold py-3 px-8 rounded-lg shadow-xl transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    <SaveIcon /> Submit Surat Jalan ({spbitems.length} Item)
                  </button>
                </div>
                </>
            )}
            {/* End Item List */}
          </div>
        </div>
      </div>
  );
}

export default App;