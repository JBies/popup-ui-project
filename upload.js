// upload.js
const multer = require('multer');
const path = require('path');

// Määritetään tiedostojen väliaikainen tallennuspaikka ja nimeämiskäytäntö
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Varmista, että tämä kansio on olemassa
  },
  filename: (req, file, cb) => {
    // Luodaan uniikki tiedostonimi aikaleiman ja alkuperäisen tiedostopäätteen avulla
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Funktio tiedostotyypin tarkistamiseen (vain kuvat sallitaan)
const fileFilter = (req, file, cb) => {
  // Hyväksytään vain kuvat
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Vain kuvatiedostot ovat sallittuja!'), false);
  }
};

// Luodaan multer-instanssi määritetyillä asetuksilla
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Rajoitetaan koko 2MB:iin
  },
  fileFilter: fileFilter
});

module.exports = upload;