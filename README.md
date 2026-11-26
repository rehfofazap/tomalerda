<div align="center">

<img src="src-tauri/icons/icon.png" width="120" alt="tomalerda" />

# tomalerda

apaga suas mensagens do discord sem precisar ficar clicando uma por uma 🗑️

[![Baixar](https://img.shields.io/badge/baixar-Windows-ff4fa3?style=for-the-badge&logo=windows)](https://github.com/rehfofazap/tomalerda/releases/latest)
[![Versão](https://img.shields.io/github/v/release/rehfofazap/tomalerda?style=for-the-badge&color=ff8cc6&label=vers%C3%A3o)](https://github.com/rehfofazap/tomalerda/releases)
[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-a3acbd?style=for-the-badge)](LICENSE)

<img src="docs/inicio.png" width="820" alt="tomalerda" />

</div>

## o que dá pra fazer

- apagar suas mensagens de um PV, DM ou grupo (pelo ID)
- limpar o PV com todos os amigos de uma vez
- limpar todas as DMs abertas
- apagar num canal ou no servidor inteiro
- apagar só as que tem uma palavra
- apagar só mídias e arquivos (fotos, vídeos, áudios...)
- usar o pacote de dados do discord (`package.zip`) pra achar mensagem que a busca não mostra
- desfazer todas as amizades, fechar todos os PVs, sair de todos os servidores
- trocar a casa da hypesquad
- modo ausente: sai de grupo quando te adicionam, fecha PV, fica afk em call e responde sozinho

também tem whitelist (ID que você coloca lá nunca é mexido), filtro por data, delay configurável, trocar de conta sem fechar o app e mostra quanto tempo falta pra terminar.

o token fica salvo no cofre do windows, não vai pra lugar nenhum além do próprio discord.

## temas

tem 17 temas, cada um com cor, fundo e ícone próprio (o ícone da barra de tarefas muda junto):

preto, rosa, azul, roxo, vermelho, cinza, menta, dourado, oceano, hello kitty, homem-aranha, zero two, naruto, one piece, dexter, rick and morty, hora de aventura e tokyo ghoul

<div align="center">
<img src="docs/temas.png" width="820" alt="temas" />
<br/><br/>
<img src="docs/menu-recolhido.png" width="820" alt="menu recolhido" />
</div>

## como instalar

1. baixa o `.exe` na aba [releases](https://github.com/rehfofazap/tomalerda/releases/latest)
2. abre e instala. se o windows reclamar ("o windows protegeu o computador"), clica em **mais informações** e depois **executar assim mesmo**
3. cola seu token e pronto

o app avisa sozinho quando sai versão nova.

pra pegar ID de alguma coisa: configurações do discord > avançado > liga o **modo desenvolvedor**, aí é só clicar com o botão direito em qualquer servidor/canal/pessoa e **copiar ID**.

## compilar

precisa de [rust](https://rustup.rs), node 18+ e o build tools do visual studio (c++).

```bash
npm install
npm run dev     # roda em modo dev
npm run build   # gera o instalador em src-tauri/target/release/bundle
```

o build tenta assinar os arquivos de atualização. se for compilar por conta própria, desliga o `createUpdaterArtifacts` no `src-tauri/tauri.conf.json` ou gera uma chave sua com `npx tauri signer generate`.

feito com tauri v2, a interface é html/css/js puro e a parte do discord fica em `src-tauri/src/discord.rs`.

## aviso

o que for apagado não volta, então cuidado.

usar token de conta normal (selfbot) é contra os termos do discord e pode dar ban. usa por sua conta e risco e deixa um delay de pelo menos 1-2s. com token de bot não tem esse problema, mas o bot só mexe nos servidores que ele tá.

**nunca passa seu token pra ninguém.** com ele a pessoa tem acesso total à sua conta.

não tenho ligação nenhuma com o discord. os personagens dos temas são dos seus donos, é só homenagem.

---

<div align="center">by <b>@rehfofazap</b> 💗</div>
