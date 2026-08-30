import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { Header } from './Header';
import { Footer } from './Footer';

export class HomePage extends BasePage {
  readonly header: Header;
  readonly footer: Footer;
  readonly heroCarousel: Locator;
  readonly findSchemesForYouButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new Header(page);
    this.footer = new Footer(page);
    this.heroCarousel = page.getByRole('region', { name: 'Image carousel' });
    this.findSchemesForYouButton = page.getByRole('button', { name: 'Find Schemes For You' });
  }

  async open(): Promise<void> {
    await this.goto('/');
  }

  async clickFindSchemesForYou(): Promise<void> {
    await this.findSchemesForYouButton.click();
  }

  async clickSearchBar(): Promise<void> {
    await this.header.searchBar.click();
  }
}
