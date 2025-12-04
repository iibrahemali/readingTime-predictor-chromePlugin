// UI components for displaying reading time badge

export const UI = {
  badgeId: 'reading-time-predictor-badge',

  // Create and show the reading time badge
  showBadge(minutes, isLearning = false) {
    // Remove existing badge if any
    this.removeBadge();

    const badge = document.createElement('div');
    badge.id = this.badgeId;
    
    if (isLearning) {
      badge.innerHTML = `📖 ~${minutes} min <span class="learning-indicator">• Learning...</span>`;
    } else {
      badge.innerHTML = `📖 ~${minutes} min read`;
    }

    badge.className = 'reading-time-badge';
    document.body.appendChild(badge);

    // Trigger fade in animation
    setTimeout(() => {
      badge.classList.add('visible');
    }, 100);
  },

  // Remove the badge
  removeBadge() {
    const existing = document.getElementById(this.badgeId);
    if (existing) {
      existing.remove();
    }
  },

  // Update badge with new time
  updateBadge(minutes, isLearning = false) {
    const badge = document.getElementById(this.badgeId);
    if (badge) {
      if (isLearning) {
        badge.innerHTML = `📖 ~${minutes} min <span class="learning-indicator">• Learning...</span>`;
      } else {
        badge.innerHTML = `📖 ~${minutes} min read`;
      }
    } else {
      this.showBadge(minutes, isLearning);
    }
  }
};

