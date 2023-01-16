import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Directory, FileInfo, Filesystem } from '@capacitor/filesystem'
import { LoadingController, Platform } from '@ionic/angular';
import { async } from 'rxjs';
const IMAGE_DIR = 'stored-images';

interface LocalFile {
  name: string;
  path: string;
  data: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  
  images: LocalFile[] = [];

  constructor( private platform: Platform, private loadingCtrl: LoadingController ) {}

  async ngOnInit() {
    this.loadFiles()
  }

  async loadFiles() {
    this.images = [];

    const loading = await this.loadingCtrl.create({
      message: 'Loading data...'
    });
    await loading.present();

    Filesystem.readdir({
      directory: Directory.Data,
      path: IMAGE_DIR
    }).then(result => {
      console.log('HERE', result)
      this.loadFileData(result.files);
    }, async err => {
      // console.log('error', err)
      await Filesystem.mkdir({
        directory: Directory.Data,
        path: IMAGE_DIR
      });
    }).then(_ =>{
      loading.dismiss();
    })
  }


// Get the actual base64 data of an image
// base on the name of the file
async loadFileData(fileNames: FileInfo[]) {
	for (let f of fileNames) {
  const filePath = `${IMAGE_DIR}/${f.name}`
  const readFile = await Filesystem.readFile({
    directory: Directory.Data,
    path: filePath
  })
  this.images.push({
    name: f.name,
    path: filePath,
    data: `data:image/jpeg;base64,${readFile.data}`
  })
	}
}

  async selectImage() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera
    });
    console.log(image);
    
    if (image) {
      this.saveImage(image);
    }
  }

  async saveImage (photo: Photo) {

    const base64Data = await this.readAsBase64(photo);
    console.log(base64Data);
    

    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      directory: Directory.Data,
      path: `${IMAGE_DIR}/${fileName}`,
      data: base64Data
    });

    console.log('saved:', savedFile);
    this.loadFiles();
    

  }

  private async readAsBase64(photo: Photo) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: photo.path ?? ''
      });
  
      return file.data;
    }
    else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath ?? '');
      const blob = await response.blob();
  
      return await this.convertBlobToBase64(blob) as string;
    }
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader;
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  startUpload() {

  }

  deleteImage() {
    
  }

}
