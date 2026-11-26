/* Idioma do app: PT (original) ou EN. Troca os textos da tela por tradução exata e acompanha o que aparece depois. */
(() => {
  "use strict";
  const EN = {
    "acordando…": "waking up…", "Cole seu token pra entrar no painel.": "Paste your token to open the dashboard.", "Contas salvas": "Saved accounts", "ou cole um token novo": "or paste a new token",
    "Token de acesso": "Access token", "Salvar conta neste PC": "Save account on this PC", "Entrar": "Sign in", "← Voltar pra": "← Back to", "Tudo que o app faz é": "Everything the app does is",
    "de verdade": "for real", "— mensagens apagadas não voltam.": "— deleted messages don't come back.", "Início": "Home", "Mensagens": "Messages", "Privados": "DMs", "Servidores": "Servers",
    "Palavra-chave": "Keyword", "Mídias e arquivos": "Media and files", "Pacote de dados": "Data package", "Conta": "Account", "Amigos e PVs": "Friends and DMs", "Sair de servidores": "Leave servers",
    "Automático": "Automatic", "Modo ausente": "Away mode", "Ajustes": "Settings", "Conta e token": "Account and token", "Preferências": "Preferences", "Aparência": "Appearance", "Atualizar": "Update",
    "versão nova disponível": "new version available", "Trocar de conta": "Switch account", "Sair da conta": "Sign out", "Desconectado": "Disconnected", "clique pra conectar": "click to connect",
    "Oi,": "Hi,", "visitante": "guest", "Conecte seu token em Conta e token pra começar.": "Connect your token in Account and token to start.", "Apagar mensagens": "Delete messages",
    "Privado por ID": "DM by ID", "Um PV, DM ou grupo": "A DM or group", "PV com todos os amigos": "DMs with all friends", "Uma conversa por amigo": "One chat per friend", "PVs e DMs abertas": "Open DMs",
    "Tudo que está na sua lista": "Everything in your list", "Chat de servidor": "Server chat", "Um canal específico": "A specific channel", "Mensagens e menções": "Messages and mentions",
    "O servidor inteiro": "The whole server", "Por palavra-chave": "By keyword", "Só o que tiver a palavra": "Only what has the word", "Fotos, vídeos e anexos": "Photos, videos and attachments",
    "Usa o package.zip": "Uses package.zip", "Limpar a conta": "Clean the account", "Remover todos os amigos": "Remove all friends", "Desfaz as amizades": "Unfriends everyone",
    "Fechar todos os PVs": "Close all DMs", "E sair dos grupos, se quiser": "And leave groups, if you want", "Sair de todos os servidores": "Leave all servers", "Menos os seus": "Except your own",
    "Casa do HypeSquad": "HypeSquad house", "Trocar ou sair": "Switch or leave", "Sai de grupos, fecha PVs, AFK em call e resposta automática": "Leaves groups, closes DMs, AFK in voice and auto reply",
    "Criar meu perfil": "Create my profile", "Seu link em tomalerda.com/seunome, com foto, música e redes": "Your link at tomalerda.com/yourname, with photo, music and socials", "Ação rápida": "Quick action",
    "Apagar privado por ID": "Delete DM by ID", "Pode ser o ID da conversa ou o ID da pessoa": "Can be the chat ID or the person's ID", "Apagar": "Delete", "Ações adicionais": "Extra actions",
    "marque quantas quiser": "check as many as you want", "Apagar PV com todos os amigos": "Delete DMs with all friends", "Abre a conversa com cada amigo e apaga": "Opens the chat with each friend and deletes",
    "Remover amizade quando apagar o PV": "Unfriend after deleting the DM", "Apagar PVs e DMs abertas": "Delete open DMs", "Cada conversa e grupo da sua lista": "Every chat and group in your list",
    "Fechar conversa após apagar": "Close chat after deleting", "(grupo não sai)": "(doesn't leave groups)", "Apagar msgs por palavra-chave": "Delete messages by keyword", "Em todos os PVs e grupos": "In all DMs and groups",
    "Apagar mídias e arquivos": "Delete media and files", "Fotos, vídeos, áudios e anexos em todos os PVs": "Photos, videos, audio and attachments in all DMs", "Delay próprio": "Own delay", "mais ajustes →": "more settings →",
    "Iniciar processos (0/4)": "Start tasks (0/4)", "Um canal": "One channel", "Funciona com usuário ou bot": "Works with user or bot", "Apagar neste canal": "Delete in this channel", "Servidor inteiro": "Whole server",
    "Todos os canais": "All channels", "Suas mensagens no servidor inteiro": "Your messages in the whole server", "Limpar também as menções": "Also clear mentions", "Esvazia a aba de menções desse servidor": "Empties this server's mentions tab",
    "Apagar no servidor": "Delete in server", "Qual palavra?": "Which word?", "Maiúsculas e minúsculas tanto faz": "Case doesn't matter", "Onde procurar": "Where to search", "Um PV ou canal": "A DM or channel",
    "Todos os PVs": "All DMs", "Um servidor": "A server", "Apagar com essa palavra": "Delete with this word", "Fotos, vídeos, áudios e arquivos": "Photos, videos, audio and files",
    "Só mensagens com anexo — texto puro fica": "Only messages with attachments — plain text stays", "Fotos": "Photos", "Vídeos": "Videos", "Áudios": "Audio", "Arquivos": "Files", "Peça seus dados": "Request your data",
    "Configurações → Dados e privacidade → Solicitar dados (marque Mensagens)": "Settings → Data & Privacy → Request data (check Messages)", "Baixe o package.zip": "Download package.zip",
    "Chega por e-mail em alguns dias": "It arrives by email in a few days", "Escolha aqui": "Pick it here", "Apaga pelo ID, até em PVs já fechados": "Deletes by ID, even in closed DMs", "Escolher .zip": "Choose .zip",
    "Escolher pasta": "Choose folder", "O que apagar": "What to delete", "Tudo": "Everything", "Só PVs e grupos": "Only DMs and groups", "Só servidores": "Only servers", "Apagar pelo pacote": "Delete from package",
    "Quem estiver na whitelist fica": "Whoever is on the whitelist stays", "Só tira da lista — as mensagens continuam lá": "Only removes from the list — messages stay", "Sair também dos grupos": "Also leave groups",
    "Opcional": "Optional", "Servidores que você é dono são pulados": "Servers you own are skipped", "Pra ficar em algum, ponha o ID dele na whitelist": "To stay in one, put its ID on the whitelist",
    "Pede um segundo clique pra confirmar antes de sair": "Asks for a second click before leaving", "Bravura": "Bravery", "Brilho": "Brilliance", "Equilíbrio": "Balance",
    "Clique numa casa pra entrar nela.": "Click a house to join it.", "Sair da HypeSquad": "Leave HypeSquad", "Desligado": "Off", "Funciona enquanto o app estiver aberto.": "Works while the app is open.",
    "Ligar": "Turn on", "grupos saídos": "groups left", "PVs fechados": "DMs closed", "respostas": "replies", "Sair de grupos quando me adicionarem": "Leave groups when someone adds me", "Sai na hora, sem avisar": "Leaves right away, silently",
    "Fechar o PV quando alguém me chamar": "Close the DM when someone messages me", "A conversa sai da lista": "The chat leaves your list", "Ficar AFK em call": "Stay AFK in voice", "Volta sozinho se cair": "Rejoins if dropped",
    "Mutado": "Muted", "Ensurdecido": "Deafened", "Responder automaticamente": "Auto reply", "Uma vez a cada 10 min por conversa": "Once every 10 min per chat",
    "Nunca é enviado pra lugar nenhum além do Discord": "Never sent anywhere except Discord", "Lembrar neste PC": "Remember on this PC", "Guarda no Cofre de credenciais do Windows, protegido pela sua conta": "Stored in Windows Credential Manager, protected by your account",
    "Conectar": "Connect", "Delay customizado": "Custom delay", "Tempo entre cada ação — padrão 1,2 s": "Time between actions — default 1.2 s", "Só um período": "Only a period", "Apaga só entre duas datas": "Deletes only between two dates",
    "Whitelist (IDs protegidos) →": "Whitelist (protected IDs) →", "Usar whitelist": "Use whitelist", "Nunca mexe nos IDs protegidos abaixo — salva sozinho": "Never touches the protected IDs below — saves automatically",
    "Usuários e DMs": "Users and DMs", "IDs de pessoas, PVs, grupos ou canais que não serão afetados": "IDs of people, DMs, groups or channels that won't be touched",
    "Servidores protegidos das ações em massa (sair de todos, menções...)": "Servers protected from bulk actions (leave all, mentions...)", "Usuários protegidos": "Protected users", "Servidores protegidos": "Protected servers",
    "Cores": "Colors", "Preto": "Black", "Rosa": "Pink", "Azul": "Blue", "Roxo": "Purple", "Vermelho": "Red", "Cinza": "Gray", "Menta": "Mint", "Dourado": "Gold", "Oceano": "Ocean", "Personagens": "Characters",
    "Homem-Aranha": "Spider-Man", "Hora de Aventura": "Adventure Time", "Estilo dos painéis": "Panel style", "Sólido": "Solid", "Sem transparência": "No transparency", "Translúcido": "Translucent",
    "Leve, dá pra ver o fundo": "Light, you can see the background", "Vidro": "Glass", "Fosco e desfocado": "Frosted and blurred", "Vidro líquido com reflexo": "Liquid glass with reflection", "Acrílico": "Acrylic",
    "Vidro tingido na cor": "Tinted glass", "Bordas que brilham": "Glowing borders", "Ajustes do visual": "Look settings", "Quanto do estilo aparece nos painéis e como fica o fundo": "How much style shows on panels and how the background looks",
    "Padrão": "Default", "Painéis": "Panels", "Intensidade": "Intensity", "Desfoque": "Blur", "Fundo": "Background", "Escurecer": "Darken", "Fundo personalizado": "Custom background", "sem imagem": "no image",
    "Imagem ou GIF de fundo": "Background image or GIF", "PNG, JPG, WEBP ou GIF animado, até 30 MB. Fica só neste PC.": "PNG, JPG, WEBP or animated GIF, up to 30 MB. Stays on this PC only.", "Escolher arquivo": "Choose file",
    "Remover": "Remove", "Luzes animadas no fundo": "Animated background lights", "As manchas de cor se mexem devagar": "The color blobs move slowly", "Tela de abertura": "Splash screen",
    "Animação com barra de % ao abrir o app": "Animation with a % bar when opening the app", "Atividade": "Activity", "Parado": "Idle", "vistas": "seen", "feitas": "done", "puladas": "skipped", "Nenhum processo": "No tasks",
    "Registro": "Log", "limpar": "clear", "Parar": "Stop", "Segundo plano (fica perto do relógio)": "Background (stays near the clock)", "Minimizar": "Minimize", "Fechar": "Close", "Cole seu token aqui…": "Paste your token here…",
    "Mostrar/ocultar": "Show/hide", "Recolher menu": "Collapse menu", "Instalar a versão nova": "Install the new version", "ID do PV, do grupo ou da pessoa": "DM, group or person ID", "Ver de quem é": "See who it is",
    "Apagar suas mensagens aqui": "Delete your messages here", "Digite a palavra-chave…": "Type the keyword…", "Adicionar palavra": "Add word", "ID do canal": "Channel ID", "ID do servidor (opcional)": "Server ID (optional)",
    "ID do autor (vazio = você)": "Author ID (empty = you)", "ID do servidor": "Server ID", "ex: meu número, endereço, nome...": "e.g. my number, address, name...", "Caminho do package.zip ou da pasta": "Path to package.zip or folder",
    "ID do servidor (vazio = call de PV)": "Server ID (empty = DM call)", "ID do canal de voz": "Voice channel ID", "ex: tô ausente agora, respondo mais tarde": "e.g. I'm away now, I'll reply later", "Cole seu token aqui": "Paste your token here",
    "De": "From", "Até": "To", "Insira o ID do usuário ou da DM": "Enter the user or DM ID", "Adicionar": "Add", "Insira o ID do servidor": "Enter the server ID",
    "Idioma": "Language", "Português ou inglês": "Portuguese or English",
  };
  const ATTR = ["placeholder", "title", "aria-label"];
  const orig = new WeakMap();
  let lang = localStorage.getItem("lang") === "en" ? "en" : "pt";
  const tr = (s) => { const k = s.replace(/\s+/g, " ").trim(); return EN[k] ? s.replace(k, EN[k]) : null; };
  function aplicar(raiz) {
    if (lang !== "en") return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (n.parentNode && /SCRIPT|STYLE/.test(n.parentNode.nodeName)) continue;
      const t = tr(n.nodeValue);
      if (t) { if (!orig.has(n)) orig.set(n, n.nodeValue); n.nodeValue = t; }
    }
    const els = raiz.querySelectorAll ? raiz.querySelectorAll("[placeholder],[title],[aria-label]") : [];
    for (const el of els) for (const a of ATTR) {
      const v = el.getAttribute(a); const t = v && tr(v);
      if (t) { el.dataset["pt" + a.replace("-", "")] = v; el.setAttribute(a, t); }
    }
  }
  function voltar() { location.reload(); }
  const obs = new MutationObserver((ms) => {
    if (lang !== "en") return;
    obs.disconnect();
    for (const m of ms) {
      if (m.type === "characterData") { const t = tr(m.target.nodeValue); if (t) m.target.nodeValue = t; }
      for (const n of m.addedNodes) n.nodeType === 3 ? (tr(n.nodeValue) && (n.nodeValue = tr(n.nodeValue))) : n.nodeType === 1 && aplicar(n);
    }
    ligar();
  });
  const ligar = () => obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  window.mudarIdioma = (l) => { localStorage.setItem("lang", l); if (l === "pt") return voltar(); lang = "en"; document.documentElement.lang = "en"; aplicar(document.body); };
  document.addEventListener("DOMContentLoaded", () => {
    const sel = document.getElementById("langSel");
    if (sel) { sel.value = lang; sel.addEventListener("change", () => window.mudarIdioma(sel.value)); }
    if (lang === "en") { document.documentElement.lang = "en"; aplicar(document.body); }
    ligar();
  });
})();
