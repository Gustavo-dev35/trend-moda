// Este é o seu "banco de dados" na memória
const express = require('express');
const app = express();

app.use(express.json()); // Permite salvar novos produtos
app.use(express.static(__dirname)); // Conecta o HTML e o JS

let dbData = {
  senhaAdmin: 'TrendModa',
  whatsapp: { numero: '554130592770', mensagem: 'Olá! Vim pelo site da Trend Moda e gostaria de atendimento.' },
  hero: {
    titulo: 'Trend Moda',
    subtitulo: 'Moda feminina atual, com estilo e atendimento próximo.',
    foto: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=60'
  },
  lojas: {
    pinhais: { endereco: 'Av. Iraí, 1612 - Weissópolis - Pinhais/PR', horario: 'Seg a sex: 10h-19h · Sáb: 10h-18h' },
    curitiba: { endereco: 'Rua Barão do Serro Azul, 110 - Centro - Curitiba/PR', horario: 'Seg a sex: 10h-19h · Sáb: 10h-18h' }
  },
  produtos: [
    { 
      id: 1, 
      nome: 'Vestido Tomara que Caia', 
      categoria: 'Vestido (Moda Feminina)', 
      preco: 89.99, 
      precoPromo: null, 
      tamanhos: 'P,M,G,GG', 
      tag: 'Outono/Inverno', 
      fotos: [
        'https://lh3.googleusercontent.com/d/1Otmz1ugZApuoQpl05g_6-TzI5cMFuChi',
        'https://lh3.googleusercontent.com/d/1SXlrx2txB0RlwJ6vEtaG0UqpTT_ySD2H'
      ],
      descricao: 'O vestido que te acompanha nos looks outono inverno.', 
      estoque: true 
    },

 {
        id: 2,
        nome: 'Regata Canelada',
        categoria: 'Regata (Moda Feminina)',
        preco: 24.99,
        precoPromo: null,
        tamanhos: 'P,M,G,GG',
        tag: 'Básico',
        fotos: [
          'https://lh3.googleusercontent.com/d/1RL9rNhysnH32zy85hXly5F3kAKiQ9QKv'
        ],
        descricao: 'Canelado Macio e com elastano !',
        estoque: true
      }
    ]
  };

// Rota para LER os dados (GET)
app.get('/api/data', (req, res) => {
  res.json(dbData);
});

// Rota para SALVAR os dados (POST)
app.post('/api/data', (req, res) => {
  dbData = req.body;
  res.json({ success: true, message: 'Dados atualizados com sucesso no servidor!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});