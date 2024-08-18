import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Function to format timestamp to dd/MM/yyyy
const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000); // Convert Firestore timestamp to JS Date
  return format(date, 'dd/MM/yyyy');
};

// Fetch data from Firestore
const fetchData = async () => {
  const db = getFirestore();

  const sjHeaderRef = collection(db, "surat_jalan");
  const sjDetailRef = collection(db, "surat_jalan_items");

  const sjHeaderSnapshot = await getDocs(sjHeaderRef);
  const sjDetailSnapshot = await getDocs(sjDetailRef);

  // Map Firestore data with date formatting and sort by id descending
  const sjHeaderData = sjHeaderSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        tglSuratJalan: formatDate(data.tglSuratJalan) // Format date field
      };
    })
    .sort((a, b) => {
      // Ensure ids are numbers for numerical comparison
      const idA = Number(a.id);
      const idB = Number(b.id);
      return idB - idA; // Sort by id descending
    });

  const sjDetailData = sjDetailSnapshot.docs
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        idSurat: Number(data.idSurat), // Ensure idSurat is a number
        item: JSON.stringify(data.item), // Keep item as JSON string
        ...data
      };
    })
    .sort((a, b) => {
      // Sort by idSurat numerically and in descending order
      const idSuratA = Number(a.idSurat);
      const idSuratB = Number(b.idSurat);
      return idSuratB - idSuratA; // Sort by idSurat descending
    });

  return { sjHeaderData, sjDetailData };
};

// Helper function to convert binary string to array buffer
const s2ab = (s) => {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF;
  }
  return buf;
};

// Function to export data to Excel
const exportToExcel = async () => {
  console.log("Exporting to Excel");
  try {
    const { sjHeaderData, sjDetailData } = await fetchData();

    // Ensure idSurat is the first column
    const sjDetailDataWithIdFirst = sjDetailData.map(({ idSurat, ...rest }) => ({ idSurat, ...rest }));

    const sjHeaderSheet = XLSX.utils.json_to_sheet(sjHeaderData);
    const sjDetailSheet = XLSX.utils.json_to_sheet(sjDetailDataWithIdFirst);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sjHeaderSheet, "Surat Jalan");
    XLSX.utils.book_append_sheet(wb, sjDetailSheet, "Surat Jalan Items");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "binary" });
    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });

    // Create a temporary link element
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "surat_jalan_data.xlsx";

    // Append the link to the document
    document.body.appendChild(link);

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up by removing the link
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting data to Excel:", error);
  }
};

export default exportToExcel;
