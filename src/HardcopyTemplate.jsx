import React from 'react'
import LogoPama from './assets/pamatrans.png'



const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
var tglSurat = new Date();
var dateString = tglSurat.getDate() + " " + months[tglSurat.getMonth()] + " " + tglSurat.getFullYear();

class HardcopyTemplate extends React.PureComponent {





  parseTimestamp = (time) => {

    const timeObj = new Date(time.toDate());
    const year = timeObj.getFullYear();
    return year;
  }


  render() {
    return (
      <div id='output-report' className=" pageMargin w-[210mm] h-[297mm] m-auto p-[0.5in] border border-gray-300">
        <div className="heading__container inline-flex justify-center items-center">
          <div className="heading__logo mr-2">
            <img src={LogoPama} className=" h-11 w-11" alt="" />
          </div>
          <div className="heading__identity leading-none">
            <h6>PT. Pamapersada Nusantara</h6>
            <h6>Site BRCG</h6>
            <h6>SM Department</h6>
          </div>
        </div>
        <div className="judul w-full flex-col h-20  content-center justify-center items-center mx-auto ">
          <h1 className='font-bold text-center text-lg'>SURAT PENGIRIMAN BARANG</h1>
          <h1 className='text-center text-sm'>No : BRCG/WH/{this.props.header ? this.props.header.spbType : ""}/{this.props.header ? this.props.header.id : ""}/{this.props.header ? this.parseTimestamp(this.props.header.tglSuratJalan) : ""}</h1>

        </div>

        <div className="flex mt-6">
          <div className="w-1/5 ">
          <div className="footer__sign text-start">
              <h1 className=' font-bold underline text-xs'>Data Pengiriman </h1>
              <h1 className='text-xs'>Ekspedisi</h1>
              <h1 className='text-xs'>Nomor Polisi</h1>
              <h1 className='text-xs'>Penerima</h1>
            </div>
          </div>
          <div className="w-2/5 ">
          <div className="footer__sign text-start">
              <h1 className='text-white'>&#160;</h1>
              <h1 className='text-xs'>: {this.props.header ? this.props.header.ekspedisi : ""}</h1>
              <h1 className='text-xs'>: {this.props.header ? this.props.header.nopol : ""}</h1>
              <h1 className='text-xs'>: _______________</h1>
            </div>
          </div>
          <div className="w-2/5 ">
          <div className="footer__sign text-start">
              <h1 className=' text-xs font-bold underline'>Kepada Yth.</h1>
              <h1 className='text-xs'>{this.props.header? this.props.header.tujuan : ""}</h1>
              <h1 className='text-xs'>di</h1>
              <h1 className='text-xs'>{this.props.header? this.props.header.kota : ""}</h1>
            </div>
          </div>
        </div>

        {/* <div className="mt-10 signature grid grid-rows-1 grid-cols-5 p-2">
          <div className="row-span-1 grid grid-rows-1 place-content-between justify-start">
            <div className="footer__sign text-start">
              <h1 className='text-center font-bold underline'>Data Pengiriman </h1>
              <h1>Ekspedisi</h1>
              <h1>Nomor Polisi</h1>
              <h1>Penerima</h1>
            </div>
          </div>
          <div className="row-span-1 grid grid-rows-1 place-content-between justify-start">
            <div className="footer__sign text-start">
              <h1 className='text-white'>&#160;</h1>
              <h1>: {this.props.header ? this.props.header.ekspedisi : ""}</h1>
              <h1>: {this.props.header ? this.props.header.nopol : ""}</h1>
              <h1>: _______________</h1>
            </div>
          </div>
          <div className="row-span-1 grid grid-rows-1 place-content-between justify-start">

          </div>
          <div className="row-span-1 grid grid-rows-1 place-content-between justify-start">
            
          </div>
          <div className="row-span-1 grid grid-rows-1 place-content-between justify-start">
            <div className="footer__sign text-start">
              <h1 className='text-center font-bold underline'>Kepada Yth.</h1>
              <h1>{this.props.header? this.props.header.tujuan : ""}</h1>
              <h1>di</h1>
              <h1>{this.props.header? this.props.header.kota : ""}</h1>
            </div>
          </div>



        </div> */}

        <div className="mt-6 list__barang h-1/3 w-full block">
          <table className="table-fixed w-full mt-3 items-start">
            <thead>
              <tr>
                <th className="py-2 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  No.
                </th>
                <th className="p-0 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  Nama Barang
                </th>
                <th className="p-0 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  Qty
                </th>
                <th className="p-0 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  Satuan
                </th>
                <th className="p-0 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  Referensi
                </th>
                <th className="p-0 font-bold uppercase bg-slate-200 text-xs text-gray-600 table-cell">
                  Remark
                </th>
              </tr>
            </thead>

            <tbody>
              {

                this.props.detail ? this.props.detail.map((item) => (
                  <tr key={item.id} className={item.id % 2 == 0 ? `bg-white hover:bg-gray-100` : `bg-gray-100 hover:bg-gray-200` + `table-row flex-row flex-wrap flex-no-wrap mb-10`}>

                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center text-xs border-b table-cell auto">
                      {item.id + 1}
                    </td>

                    <td className="w-full lg:w-auto p-3 text-gray-800 text-xs border-b table-cell static">
                      {item.namaBarang}
                    </td>

                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center text-xs border-b table-cell static">
                      {item.qty}
                    </td>

                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center text-xs border-b table-cell static">
                      <span className="">
                        {item.satuan}
                      </span>
                    </td>

                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center text-xs border-b table-cell static">
                      {item.referensi}
                    </td>
                    <td className="w-full lg:w-auto p-3 text-gray-800 text-center text-xs border-b table-cell static">

                    </td>

                  </tr>

                )) : <tr>
                  <td>
                    <div className='w-full flex items-center justify-center text-center   m-auto'>
                      <h1>No Data</h1>
                    </div>
                  </td>

                </tr>

              }

            </tbody>
          </table>
        </div>


        <div className="tanggal mt-10 flex-col w-full items-end text-right justify-end">
          <h1 className='font-bold mr-3'>Gurimbang, {dateString}</h1>
        </div>

        <div className="mt-10 signature h-60 grid grid-rows-1 grid-cols-3">
          <div className="row-span-1 grid grid-rows-2 place-content-betwween justify-center">
            <h1 className='text-center'>Penerima </h1>
            <div className="footer__sign text-center">
              <h1>___________ </h1>
              <h1 className='text-xs'>{this.props.header ? this.props.header.ekspedisi : ""}</h1>
            </div>

          </div>

          <div className="row-span-1 grid grid-rows-2 place-content-betwween justify-center">
            <h1 className='text-center'>Mengetahui </h1>
            <div className="footer__sign text-center">
              <h1 className='font-bold'>{this.props.header ? this.props.header.pengawas : ""}</h1>
              <h1 className='text-xs'>Pengawas</h1>
            </div>

          </div>

          <div className="row-span-1 grid grid-rows-2 place-content-betwween justify-center">
            <h1 className='text-center'>Dibuat Oleh </h1>
            <div className="footer__sign text-center">
              <h1 className='font-bold'>{this.props.header ? this.props.header.creator : ""}</h1>
              <h1 className='text-xs'>Creator</h1>
            </div>

          </div>
        </div>
      </div>
    );
  }
}

export default HardcopyTemplate;
