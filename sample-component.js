// Sample Component for Tatooine Airbnb
// This demonstrates the modular component structure used in the project

class SampleCard {
  constructor(data) {
    this.data = data;
    this.element = null;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'listing-card';
    card.innerHTML = `
      <div class="card-image">
        <img src="${this.data.image}" alt="${this.data.title}" loading="lazy">
        <div class="price-badge">$${this.data.price_per_night}/night</div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${this.data.title}</h3>
        <p class="card-location">${this.data.location}</p>
        <div class="card-meta">
          <span class="rating">★ ${this.data.rating}</span>
          <span class="reviews">(${this.data.reviews} reviews)</span>
          <span class="beds">${this.data.beds} beds</span>
        </div>
      </div>
    `;
    
    card.addEventListener('click', () => this.openModal());
    this.element = card;
    return card;
  }

  openModal() {
    const modal = new ListingModal(this.data);
    modal.show();
  }
}

// Export for use in main script
window.SampleCard = SampleCard;