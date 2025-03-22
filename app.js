const SUPABASE_URL = 'https://mkaqtowoyddwftmqlhor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rYXF0b3dveWRkd2Z0bXFsaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MjM2MTksImV4cCI6MjA1ODA5OTYxOX0.vTvxyrbz2Bag3SN05wnRaVuaRDLu1oMCEwoJUK5ad38';

// INI PERUBAHANNYA, PAKE window.supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase initialized:', supabase);

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
    li.className = 'flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-2 rounded shadow gap-2';

    const fileName = file.nama_file;
    const filePath = file.file_path;
    const fileExt = filePath.split('.').pop().toLowerCase();
    const customPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${file.file_path}`;

    console.log('File:', fileName, 'Ext:', fileExt, 'URL:', customPublicUrl);

    let previewElement = '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      previewElement = `<img src="${customPublicUrl}" alt="${fileName}" class="w-24 h-24 object-cover rounded border" />`;
    } else if (fileExt === 'pdf') {
      previewElement = `<button class="preview-pdf-btn bg-blue-500 text-white px-3 py-1 rounded" data-url="${customPublicUrl}">Preview PDF</button>`;
    } else {
      previewElement = `<div class="text-gray-500">No Preview</div>`;
    }

    li.innerHTML = `
         <div class="flex items-center space-x-4">
          ${previewElement}
          <span>${file.nama_file}</span>
        </div>
        <div class="flex space-x-3">
          <a href="${customPublicUrl}" target="_blank" class="text-blue-500 underline">Download</a>
          <button onclick="deleteFile('${file.id}', '${file.file_path}')" class="text-red-500 underline">Delete</button>
        </div>
      `;

    fileList.appendChild(li);
  });

  document.querySelectorAll('.preview-pdf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pdfUrl = e.target.getAttribute('data-url');
      showPdfPreview(pdfUrl);
    });
  });
}

// Fungsi buat munculin modal PDF
function showPdfPreview(url) {
  const modal = document.getElementById('pdfModal');
  const viewer = document.getElementById('pdfViewer');
  modal.classList.remove('hidden');
  viewer.src = url;
}

// Tombol close modal
document.getElementById('closePdfModal').addEventListener('click', () => {
  const modal = document.getElementById('pdfModal');
  const viewer = document.getElementById('pdfViewer');
  modal.classList.add('hidden');
  viewer.src = '';
});


function closePreview() {
  const modal = document.getElementById('previewModal');
  const iframe = document.getElementById('pdfViewer');

  iframe.src = '';
  modal.classList.add('hidden');
}

async function deleteFile(fileId, filePath) {
  const confirmed = confirm('Yakin mau hapus file ini?');
  if (!confirmed) return;

  // Hapus dari storage
  const { error: deleteStorageError } = await supabase
    .storage
    .from('dokumen')
    .remove([filePath]);

  if (deleteStorageError) {
    console.error('Gagal hapus file dari storage:', deleteStorageError);
    alert('Gagal hapus file dari storage!');
    return;
  }

  // Hapus dari database
  const { error: deleteDbError } = await supabase
    .from('dokumen_files')
    .delete()
    .eq('id', fileId);

  if (deleteDbError) {
    console.error('Gagal hapus data dari database:', deleteDbError);
    alert('Gagal hapus data dari database!');
    return;
  }

  alert('File berhasil dihapus!');
  loadFiles();
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = '0%';
  
    const fileInput = document.getElementById('fileInput');
    const namaFile = document.getElementById('namaFile').value.trim();
  
    if (!fileInput.files.length) {
      alert('Pilih file terlebih dahulu!');
      return;
    }
  
    const file = fileInput.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;
  
    // Karena supabase-js ga support progress upload di UMD,
    // kita bikin manual pake fetch (bisa juga XMLHttpRequest)
    const formData = new FormData();
    formData.append('cacheControl', '3600');
    formData.append('file', file);
  
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/dokumen/${filePath}`;
  
  
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);
  
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = `${percent}%`;
      }
    });
  
    xhr.onload = async () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const customPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/dokumen/${filePath}`;
  
        const { error: dbError } = await supabase
          .from('dokumen_files')
          .insert([{
            nama_file: namaFile,
            file_path: `dokumen/${filePath}`
          }]);
  
        if (dbError) {
          alert('Gagal simpan data! ' + dbError.message);
          return;
        }
  
        alert('File berhasil diupload!');
        uploadForm.reset();
        progressBar.style.width = '0%';
        loadFiles();
      } else {
        console.error(xhr.responseText);
        alert('Gagal upload file!');
      }
    };
  
    xhr.onerror = () => {
      alert('Gagal upload file!');
    };
  
    xhr.send(file);
  });
  
  // Load pertama kali
  loadFiles();

