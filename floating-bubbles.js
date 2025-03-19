// floating-bubbles.js
// Skripti animoituihin kelluviin palloihin etusivulla

class FloatingBubbles {
    constructor(containerId, options = {}) {
      // Containerin valinta
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Container with id '${containerId}' not found`);
        return;
      }
  
      // Asetukset
      this.options = {
        bubbleCount: options.bubbleCount || 15,        // Pallojen määrä
        minSize: options.minSize || 40,                // Pienin pallon koko pikseleinä
        maxSize: options.maxSize || 120,               // Suurin pallon koko pikseleinä
        minSpeed: options.minSpeed || 0.5,             // Liikkeen miniminopeus
        maxSpeed: options.maxSpeed || 1.5,             // Liikkeen maksiminopeus
        popInterval: options.popInterval || 3000,      // Kuinka usein pallo poksahtaa (ms)
        messages: options.messages || [                // Oletusviestit
          "Lisää sivustosi myyntiä popupeilla",
          "Lisää konversiota sivustolla vierailijoista",
          "Mutta popupit ovat ärsyttäviä",
          "...Mutta tehokkaita!",
          "Näe kuinka moni klikkaa popuppiasi",
          "Tuo sivustosi eloon popupeilla",
          "Ota yhteyttä asiakkaisiisi tehokkaasti",
          "Näytä tarjoukset kun ne ovat ajankohtaisia",
          "Helppo käyttöliittymä, tehokkaat tulokset",
          "Popupit toimivat kaikilla laitteilla"
        ],
        colors: options.colors || [                    // Pallojen värit
          'rgba(66, 133, 244, 0.7)',   // Sininen
          'rgba(219, 68, 55, 0.7)',    // Punainen
          'rgba(244, 180, 0, 0.7)',    // Keltainen
          'rgba(15, 157, 88, 0.7)',    // Vihreä
          'rgba(171, 71, 188, 0.7)',   // Violetti
          'rgba(255, 112, 67, 0.7)'    // Oranssi
        ]
      };
  
      // Container-elementin tyylimääritykset
      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      
      // Tarkista containerin korkeus
      if (this.container.clientHeight === 0) {
        this.container.style.height = '80vh'; // Oletuskorkeus jos ei määritetty
      }
  
      // Pallojen säilytys
      this.bubbles = [];
      
      // Pidetään kirjaa käytetyistä viesteistä, jotta ei toisteta peräkkäin
      this.usedMessageIndexes = [];
      
      // Alustetaan pallot
      this.initialize();
      
      // Aloitetaan animaatio
      this.animate();
      
      // Aloitetaan pallojen "poksauttaminen" intervallilla
      this.popInterval = setInterval(() => this.popRandomBubble(), this.options.popInterval);
    }
  
    // Luo yksittäisen pallon
    createBubble() {
      const bubble = document.createElement('div');
      
      // Pallon koko (satunnainen min ja max välillä)
      const size = Math.floor(Math.random() * (this.options.maxSize - this.options.minSize + 1)) + this.options.minSize;
      
      // Satunnainen sijainti containerin sisällä
      const startX = Math.random() * (this.container.clientWidth - size);
      const startY = this.container.clientHeight + size; // Aloitetaan containerin alapuolelta
      
      // Liikkumisnopeus (satunnainen)
      const speed = Math.random() * (this.options.maxSpeed - this.options.minSpeed) + this.options.minSpeed;
      
      // Satunnainen väri
      const colorIndex = Math.floor(Math.random() * this.options.colors.length);
      
      // Asetetaan pallon tyylimääritykset
      Object.assign(bubble.style, {
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        left: `${startX}px`,
        top: `${startY}px`,
        backgroundColor: this.options.colors[colorIndex],
        borderRadius: '50%',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        transform: 'scale(1)',
        transition: 'transform 0.3s ease-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '5',
        cursor: 'pointer' // Vihjaileva kursori
      });
      
      // Lisätään pallo containeriin
      this.container.appendChild(bubble);
      
      // Pallon tiedot
      const bubbleData = {
        element: bubble,
        size: size,
        x: startX,
        y: startY,
        speed: speed,
        popped: false, // Onko pallo poksahtanut
        hasMessage: false // Onko pallolla viesti
      };
      
      // Lisätään klikkaus-tapahtuma
      bubble.addEventListener('click', () => this.popBubble(bubbleData));
      
      return bubbleData;
    }
  
    // Alustaa kaikki pallot
    initialize() {
      for (let i = 0; i < this.options.bubbleCount; i++) {
        this.bubbles.push(this.createBubble());
      }
    }
  
    // Poksauttaa pallon ja näyttää viestin
    popBubble(bubble) {
      if (bubble.popped || bubble.hasMessage) return;
      
      bubble.popped = true;
      bubble.element.style.transform = 'scale(0)';
      
      // Näytä viesti
      this.showMessage();
      
      // Luo uusi pallo poistetun tilalle pienen viiveen jälkeen
      setTimeout(() => {
        this.container.removeChild(bubble.element);
        const index = this.bubbles.indexOf(bubble);
        if (index > -1) {
          this.bubbles[index] = this.createBubble();
        }
      }, 300);
    }
  
    // Poksauttaa satunnaisen pallon
    popRandomBubble() {
      // Löydä pallo joka on näkyvissä ja jota ei ole vielä poksautettu
      const visibleBubbles = this.bubbles.filter(bubble => 
        !bubble.popped && bubble.y < this.container.clientHeight - bubble.size && bubble.y > 0
      );
      
      if (visibleBubbles.length > 0) {
        const randomIndex = Math.floor(Math.random() * visibleBubbles.length);
        this.popBubble(visibleBubbles[randomIndex]);
      }
    }
  
    // Näyttää viestin
    showMessage() {
      // Valitse satunnainen viesti, joka ei ole edellinen
      let messageIndex;
      
      do {
        messageIndex = Math.floor(Math.random() * this.options.messages.length);
      } while (
        this.usedMessageIndexes.length > 0 && 
        this.usedMessageIndexes[this.usedMessageIndexes.length - 1] === messageIndex &&
        this.options.messages.length > 1
      );
      
      this.usedMessageIndexes.push(messageIndex);
      
      // Säilytä vain viimeisimmät 3 viestiä
      if (this.usedMessageIndexes.length > 3) {
        this.usedMessageIndexes.shift();
      }
      
      const message = this.options.messages[messageIndex];
      
      // Luo viestielementti
      const messageElement = document.createElement('div');
      Object.assign(messageElement.style, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(0)',
        padding: '15px 20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '10px',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        zIndex: '10',
        maxWidth: '80%',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
        opacity: '0',
        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s ease'
      });
      
      messageElement.textContent = message;
      this.container.appendChild(messageElement);
      
      // Animoi viesti sisään
      setTimeout(() => {
        messageElement.style.transform = 'translate(-50%, -50%) scale(1)';
        messageElement.style.opacity = '1';
      }, 10);
      
      // Poista viesti animaation jälkeen
      setTimeout(() => {
        messageElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
        messageElement.style.opacity = '0';
        
        setTimeout(() => {
          this.container.removeChild(messageElement);
        }, 500);
      }, 2000);
    }
  
    // Animoi pallojen liikkeen
    animate() {
      // Päivitä kaikkien pallojen sijainti
      this.bubbles.forEach(bubble => {
        if (bubble.popped) return;
        
        // Liikuta palloa ylöspäin
        bubble.y -= bubble.speed;
        bubble.element.style.top = `${bubble.y}px`;
        
        // Jos pallo on mennyt containerin yläpuolelle, palauta se alaosaan
        if (bubble.y < -bubble.size) {
          bubble.y = this.container.clientHeight + bubble.size;
          bubble.x = Math.random() * (this.container.clientWidth - bubble.size);
          bubble.element.style.left = `${bubble.x}px`;
        }
      });
      
      // Jatka animaatiota
      requestAnimationFrame(() => this.animate());
    }
  
    // Lopeta animaatio ja puhdista resurssit
    destroy() {
      clearInterval(this.popInterval);
      this.bubbles.forEach(bubble => {
        if (bubble.element.parentNode) {
          this.container.removeChild(bubble.element);
        }
      });
      this.bubbles = [];
    }
  }
  
  // Vie FloatingBubbles -luokka globaaliin scopeen
  window.FloatingBubbles = FloatingBubbles;