// swagger.js
// Swagger/OpenAPI-dokumentaation konfigurointi

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger-dokumentaation metatieto-osuus
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Popup Manager API',
      version: '1.0.0',
      description: 'API-dokumentaatio Popup Manager -sovelluksen rajapinnoille',
      contact: {
        name: 'Joni Bies',
        email: 'joni.bies@gmail.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Kehitysympäristö'
      }
    ],
    // Määritellään käyttäjän tunnistautuminen (JWT tai OAuth)
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid'
        }
      },
      schemas: {
        // Määritellään yleisimpiä tietorakenteita
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Käyttäjän MongoDB ID'
            },
            googleId: {
              type: 'string',
              description: 'Google OAuth ID'
            },
            displayName: {
              type: 'string',
              description: 'Käyttäjän näyttönimi'
            },
            email: {
              type: 'string',
              description: 'Käyttäjän sähköposti'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'pending'],
              description: 'Käyttäjän rooli'
            },
            profilePicture: {
              type: 'string',
              description: 'URL profiilikuvaan'
            },
            registeredAt: {
              type: 'string',
              format: 'date-time',
              description: 'Rekisteröitymisaika'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Viimeisen kirjautumisen aika'
            },
            approvedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Hyväksymisaika'
            }
          }
        },
        Popup: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Popupin MongoDB ID'
            },
            userId: {
              type: 'string',
              description: 'Omistavan käyttäjän ID'
            },
            name: {
              type: 'string',
              description: 'Popupin nimi'
            },
            popupType: {
              type: 'string',
              enum: ['square', 'circle', 'image'],
              description: 'Popupin tyyppi'
            },
            content: {
              type: 'string',
              description: 'Popupin sisältö'
            },
            width: {
              type: 'number',
              description: 'Popupin leveys pikseleinä'
            },
            height: {
              type: 'number',
              description: 'Popupin korkeus pikseleinä'
            },
            position: {
              type: 'string',
              enum: ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
              description: 'Popupin sijainti näytöllä'
            },
            animation: {
              type: 'string',
              enum: ['none', 'fade', 'slide'],
              description: 'Popupin animaatiotyyppi'
            },
            backgroundColor: {
              type: 'string',
              description: 'Popupin taustaväri'
            },
            textColor: {
              type: 'string',
              description: 'Popupin tekstin väri'
            },
            imageUrl: {
              type: 'string',
              description: 'Popupin kuvan URL'
            },
            linkUrl: {
              type: 'string',
              description: 'Linkki, johon popup vie klikattaessa'
            },
            timing: {
              type: 'object',
              properties: {
                delay: {
                  type: 'number',
                  description: 'Viive ennen popupin näyttämistä (sekunteina)'
                },
                showDuration: {
                  type: 'number',
                  description: 'Kesto jonka popup näkyy (sekunteina, 0 = kunnes suljetaan)'
                },
                frequency: {
                  type: 'string',
                  enum: ['always', 'once', 'daily'],
                  description: 'Kuinka usein popup näytetään'
                },
                startDate: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Popupin näyttämisen aloituspäivä'
                },
                endDate: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Popupin näyttämisen lopetuspäivä'
                }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                views: {
                  type: 'number',
                  description: 'Näyttökertojen määrä'
                },
                clicks: {
                  type: 'number',
                  description: 'Klikkausten määrä'
                },
                lastViewed: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Viimeisin näyttökerta'
                },
                lastClicked: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Viimeisin klikkaus'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Luontiaika'
            }
          }
        },
        Image: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Kuvan MongoDB ID'
            },
            userId: {
              type: 'string',
              description: 'Omistavan käyttäjän ID'
            },
            name: {
              type: 'string',
              description: 'Kuvan nimi'
            },
            url: {
              type: 'string',
              description: 'Kuvan URL'
            },
            size: {
              type: 'number',
              description: 'Kuvan koko tavuina'
            },
            mimeType: {
              type: 'string',
              description: 'Kuvan MIME-tyyppi'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Luontiaika'
            },
            usedInPopups: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Lista popupeista, joissa kuvaa käytetään'
            }
          }
        }
      }
    },
    security: [
      {
        cookieAuth: []
      }
    ]
  },
  // Polut API-reittejä sisältäviin tiedostoihin
  apis: ['./routes/*.js', './models/*.js', './swagger-docs/*.js'], // reittitiedostoja ja mallitiedostoja
};

// Luo swagger-spesifikaatio
const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Palauttaa Swagger-määrityksen
 * @returns {Object} Swagger-spesifikaatio
 */
function swaggerDocs(app, port) {
    // Swagger-sivun reitti
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }', // Piilotetaan Swagger-yläpalkki
      customSiteTitle: "Popup Manager API Documentation",
      swaggerOptions: {
        // parantaa Authorize-dialogin ohjetekstiä
        authAction: {
          cookieAuth: {
            name: "cookieAuth",
            schema: {
              type: "apiKey",
              in: "cookie",
              name: "connect.sid"
            },
            value: "**Kirjaudu ensin sovellukseen. Eväste on jo asetettu.**"
          }
        }
      }
    }));
  
    // Palauttaa swagger-spesifikaation JSON-muodossa
    app.get('/api-docs.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    });
  
    console.log(`Swagger-dokumentaatio saatavilla osoitteessa http://localhost:${port}/api-docs`);
  }

module.exports = { swaggerDocs };