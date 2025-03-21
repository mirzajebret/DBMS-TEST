const SUPABASE_URL = 'https://mkaqtowoyddwftmqlhor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rYXF0b3dveWRkd2Z0bXFsaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MjM2MTksImV4cCI6MjA1ODA5OTYxOX0.vTvxyrbz2Bag3SN05wnRaVuaRDLu1oMCEwoJUK5ad38';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const uploadForm = document.getElementById('uploadForm');
const fileList = document.getElementById('fileList');

async function loadFiles() {
  const { data, error } = await supabase
    .from('dokumen_files')
    .select('*')
    .order('tanggal_upload', { ascending: false });

  if (error) {
    console.error('Error ambil file:', error);
    return;
  }

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

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const namaFile = document.getElementById('namaFile').value.trim();

  if (!fileInput.files.length) {
    alert('Pilih file terlebih dahulu!');
    return;
  }

  const file = fileInput.files[0];
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}.${fileExt}`;

  console.log('Mulai upload:', file.name);

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('dokumen')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Upload error:', uploadError);
    alert('Gagal upload file! ' + uploadError.message);
    return;
  }

  console.log('Upload berhasil:', uploadData);

  const { data: publicUrlData } = supabase
    .storage
    .from('dokumen')
    .getPublicUrl(filePath);

  const publicURL = publicUrlData.publicUrl;
  console.log('Public URL:', publicURL);

  const { data: insertData, error: dbError } = await supabase
    .from('dokumen_files')
    .insert([{ nama_file: namaFile, file_url: publicURL }]);

  if (dbError) {
    console.error('DB Error:', dbError);
    alert('Gagal simpan data! ' + dbError.message);
    return;
  }

  console.log('Data berhasil disimpan:', insertData);

  alert('File berhasil diupload!');
  uploadForm.reset();
  loadFiles();
});

loadFiles();
