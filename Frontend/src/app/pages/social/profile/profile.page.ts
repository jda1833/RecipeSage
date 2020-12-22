import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController, AlertController, NavController, ModalController } from '@ionic/angular';

import { UserService } from '@/services/user.service';
import { LoadingService } from '@/services/loading.service';
import { UtilService, RouteMap, AuthType } from '@/services/util.service';
import { RecipeService } from '@/services/recipe.service';
import { ImageViewerComponent } from '@/modals/image-viewer/image-viewer.component';
import { NewMessageModalPage } from '@/pages/messaging-components/new-message-modal/new-message-modal.page';

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss']
})
export class ProfilePage {
  defaultBackHref: string = RouteMap.SocialPage.getPath();

  handle: string;
  profile;

  constructor(
    public navCtrl: NavController,
    public route: ActivatedRoute,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public utilService: UtilService,
    public loadingService: LoadingService,
    public recipeService: RecipeService,
    public userService: UserService) {

    this.handle = this.route.snapshot.paramMap.get('handle').substring(1);
  }

  async profileDisabledError() {
    const alert = await this.alertCtrl.create({
      header: 'Profile is not enabled',
      message: 'This user has disabled their profile and is therefore private/inaccessible.',
      buttons: [
        {
          text: 'Okay',
          handler: () => {
            this.navCtrl.navigateRoot(RouteMap.PeoplePage.getPath());
          }
        }
      ]
    });
    alert.present();
  }

  ionViewWillEnter() {
    this.load();
  }

  async load() {
    const loading = this.loadingService.start();
    this.profile = await this.userService.getProfileByHandle(this.handle, {
      403: () => this.profileDisabledError()
    });

    loading.dismiss();
  }

  async openImageViewer() {
    const imageViewerModal = await this.modalCtrl.create({
      component: ImageViewerComponent,
      componentProps: {
        imageUrls: this.profile.profileImages.map(image => image.location)
      }
    });
    imageViewerModal.present();
  }

  open(item) {
    if(item.type === 'all-recipes') {
      this.navCtrl.navigateForward(RouteMap.HomePage.getPath('main', { userId: item.userId }));
    } else if(item.type === 'label') {
      this.navCtrl.navigateForward(RouteMap.HomePage.getPath('main', { userId: item.userId, selectedLabels: [item.label.title] }));
    } else if (item.type === 'recipe') {
      this.navCtrl.navigateForward(RouteMap.RecipePage.getPath(item.recipe.id));
    }
  }

  async addFriend() {
    const loading = this.loadingService.start();

    await this.userService.addFriend(this.profile.id);
    loading.dismiss();

    const tst = await this.toastCtrl.create({
      message: 'Friend invite sent!',
      duration: 5000,
      buttons: [{
        side: 'end',
        role: 'cancel',
        text: 'Dismiss',
      }]
    });
    tst.present();

    this.load();
  }

  async deleteFriend() {
    const loading = this.loadingService.start();

    await this.userService.deleteFriend(this.profile.id);
    loading.dismiss();

    const tst = await this.toastCtrl.create({
      message: 'Friendship removed',
      duration: 5000,
      buttons: [{
        side: 'end',
        role: 'cancel',
        text: 'Dismiss',
      }]
    });
    tst.present();

    this.load();
  }

  async sendMessage() {
    const modal = await this.modalCtrl.create({
      component: NewMessageModalPage,
      componentProps: {
        initialRecipientId: this.profile.id
      }
    });
    modal.present();
  }

  isLoggedIn() {
    return this.utilService.isLoggedIn();
  }

  async refresh(refresher) {
    refresher.target.complete();
    this.load();
  }
}
