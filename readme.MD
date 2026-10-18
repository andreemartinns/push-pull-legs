# Push Pull Legs

App de treino que fiz para organizar meus treinos no esquema push/pull/legs. Dá pra registrar as cargas, ver o recorde de cada exercício, acompanhar a sequência de dias treinados e controlar a meta de água do dia.

Link do projeto: https://ritmobrasil-treino.netlify.app/

## O que ele faz

- Treinos separados em push, pull e legs
- Mostra a última carga usada em cada exercício
- Guarda o recorde pessoal
- Conta a sequência de treinos seguidos
- Meta de água com um copo que enche com animação
- Formulário de saúde
- Telas separadas para professor e administrador
- Dá pra compartilhar o treino finalizado como imagem para o story

## Tecnologias

- React Native
- Expo
- JavaScript

## Como rodar

Precisa ter o Node.js instalado. Para testar no celular, use o app Expo Go.

```bash
git clone https://github.com/andreemartinns/push-pull-legs.git
cd push-pull-legs
npm install
npx expo start
```

Depois é só escanear o QR Code com o Expo Go, ou apertar `a` (Android) ou `i` (iOS) no terminal para abrir no emulador.

## Estrutura

```
assets/     imagens e ícones
src/        telas e componentes
App.jsx     componente principal
app.json    configuração do Expo
index.js    ponto de entrada
```

## Licença

MIT. Mais detalhes no arquivo LICENSE.

## Autor

André Martins - https://github.com/andreemartinns