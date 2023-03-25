import { Component, Input } from '@angular/core';
import { NavController, ModalController, ToastController } from '@ionic/angular';

import { MessagingService } from '~/services/messaging.service';
import { UserService } from '~/services/user.service';
import { RecipeService, Recipe } from '~/services/recipe.service';
import { LoadingService } from '~/services/loading.service';
import { UtilService, RecipeTemplateModifiers, RouteMap, AuthType } from '~/services/util.service';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'page-share-modal',
  templateUrl: 'share-modal.page.html',
  styleUrls: ['share-modal.page.scss']
})
export class ShareModalPage {

  @Input() recipe: Recipe;

  selectedUser: any;
  recipientId: any;

  threads: any = [];

  shareMethod = 'account';

  recipeURL: string;

  enableJSONLD = true;
  embedHeight = 800;
  embedWidth = 600;
  embedConfig: RecipeTemplateModifiers = {
    verticalInstrIng: false,
    titleImage: true,
    hideNotes: false,
    hideSource: false,
    hideSourceURL: false,
    showPrintButton: true
  };
  recipePreviewURL: SafeResourceUrl;
  recipeEmbedURL: string;
  recipeEmbedCode: string;

  constructor(
  public navCtrl: NavController,
  public toastCtrl: ToastController,
  public utilService: UtilService,
  public loadingService: LoadingService,
  public messagingService: MessagingService,
  public recipeService: RecipeService,
  public userService: UserService,
  public modalCtrl: ModalController) {
    setTimeout(() => {
      this.recipeURL = `${window.location.protocol}//${window.location.host}`
                     + `/#/recipe/${this.recipe.id}?version=${(window as any).version}&usp=sharing`;

      this.loadThreads().then(() => {}, () => {});

      this.updateEmbed(true);
    });
  }


  cancel() {
    this.modalCtrl.dismiss();
  }

  updateEmbed(updateURL?: boolean) {
    if (updateURL) {
      this.recipePreviewURL = this.recipeEmbedURL = this.utilService.generateRecipeTemplateURL(this.recipe.id, this.embedConfig);
    }

    const jsonLDCode = `<script>
      fetch('https://api.recipesage.com/recipes/${this.recipe.id}/json-ld')
      .then(response => response.text())
      .then(structuredDataText => {
        const script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.textContent = structuredDataText;
        document.head.appendChild(script);
      });
    </script>`;

    const iframeCode = `<iframe
      style="box-shadow: 1px 1px 14px rgb(100,100,100); border: none; height: ${this.embedHeight}px; width: ${this.embedWidth}px;"
      src="${this.recipeEmbedURL}"
      scrolling="auto"
      frameborder="0"></iframe>`;

    let embedCode = '';
    if (this.enableJSONLD) embedCode += `${jsonLDCode}\n`;
    embedCode += iframeCode;

    this.recipeEmbedCode = embedCode;
  }

  async loadThreads() {
    const response = await this.messagingService.threads();
    if (!response.success) return;

    this.threads = response.data;
  }

  selectUser(user) {
    if (!user) {
      this.selectedUser = null;
      this.recipientId = null;
      return;
    }

    this.selectedUser = user;
    this.recipientId = user.id;
  }

  async send() {
    const loading = this.loadingService.start();

    const response = await this.messagingService.create({
      to: this.recipientId,
      body: '',
      recipeId: this.recipe.id
    });
    loading.dismiss();
    if (!response.success) return;

    this.modalCtrl.dismiss();
    this.navCtrl.navigateForward(RouteMap.MessageThreadPage.getPath(this.recipientId));
  }

  shareMethodChanged(event) {
    this.shareMethod = event.detail.value;
  }
}
