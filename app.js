// Ganti dengan URL & API KEY Supabase kamu
const SUPABASE_URL = 'https://mkaqtowoyddwftmqlhor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rYXF0b3dveWRkd2Z0bXFsaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MjM2MTksImV4cCI6MjA1ODA5OTYxOX0.vTvxyrbz2Bag3SN05wnRaVuaRDLu1oMCEwoJUK5ad38';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const uploadForm = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');

// Tampilkan file dari DB
async function loadFiles() {
  const { data, error } = await supabase
    .from('dokumen_files')
    .select('*')
    .order('tanggal_upload', { ascending: false });

  fileList.innerHTML = '';
  data.forEach(file => {
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-white p-2 rounded shadow';
    li.innerHTML = `
      <span>${file.nama_file}</span>
      <a href="${file.file_url}" target="_blank" class="text-blue-500 underline">Download</a>
    `;
    fileList.appendChild(li);
  });
}

// Upload file ke Storage + insert DB
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const namaFile = document.getElementById('namaFile').value.trim();

  if (!fileInput.files.length) return alert('Pilih file terlebih dahulu!');

  const file = fileInput.files[0];
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}.${fileExt}`;

  // Upload ke Storage Supabase
  const { data, error } = await supabase.storage
    .from('dokumen') // nama bucket
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    return alert('Gagal upload file!');
  }

  const { publicURL } = supabase
    .storage
    .from('dokumen')
    .getPublicUrl(filePath);

  // Simpan ke table database
  const { error: dbError } = await supabase
    .from('dokumen_files')
    .insert([{ nama_file: namaFile, file_url: publicURL }]);

  if (dbError) {
    console.error('DB Error:', dbError);
    return alert('Gagal simpan data!');
  }

  alert('File berhasil diupload!');
  uploadForm.reset();
  loadFiles();
});

// Load data pertama kali
loadFiles();
