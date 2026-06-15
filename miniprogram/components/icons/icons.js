Component({
  properties: {
    name: {
      type: String,
      value: ''
    },
    size: {
      type: Number,
      value: 48
    },
    color: {
      type: String,
      value: '#3D3D3D'
    }
  },
  
  data: {
    iconMap: {
      // Navigation icons - using Unicode symbols
      'home': '⌂',
      'recipes': '☰',
      'calendar': '📅',
      'settings': '⚙',
      
      // Action icons
      'plus': '+',
      'search': '⌕',
      'edit': '✎',
      'delete': '✕',
      'share': '↗',
      'back': '←',
      'close': '×',
      'check': '✓',
      
      // Food/Cooking icons
      'cooking': '♨',
      'ingredients': '◆',
      'steps': '●',
      'clock': '◷',
      'servings': '⊙',
      
      // Shopping/Planning icons
      'cart': '⊞',
      'week': '▦',
      
      // User/Family icons
      'user': '⊙',
      'family': '☸',
      'logout': '⊖',
      
      // Misc icons
      'image': '▣',
      'link': '🔗',
      'copy': '⧉',
      'filter': '⬡',
      'chevron-right': '›',
      'chevron-down': '⌄',
      'arrow-up': '↑'
    }
  },
  
  lifetimes: {
    attached() {
      this.setData({
        iconChar: this.data.iconMap[this.data.name] || '•'
      })
    }
  },

  observers: {
    'name': function(name) {
      this.setData({
        iconChar: this.data.iconMap[name] || '•'
      })
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap')
    }
  }
})
