# quer ajudar?

valeu! qualquer ajuda serve: achar bug, sugerir coisa, arrumar texto ou mexer no código.

## bug ou ideia

abre uma [issue](https://github.com/rehfofazap/tomalerda/issues/new/choose) e escolhe o modelo. fala a versão do app (aparece embaixo do nome, no menu) e o que aconteceu.

**nunca cola seu token** em issue, print ou log. se aparecer num print, apaga antes de mandar.

## mexer no código

precisa de [rust](https://rustup.rs), node 18+ e o build tools do visual studio (c++).

```bash
npm install
npm run dev     # abre o app em modo dev
```

- a interface é html/css/js puro em `src/` (sem framework)
- a parte que fala com o discord fica em `src-tauri/src/discord.rs`
- o resto do rust (janela, cofre do token, ícone, atualização) fica em `src-tauri/src/lib.rs`

antes de mandar o pull request:

- `cargo check` dentro de `src-tauri` sem erro
- testa o que mudou com uma conta de teste, não com a sua principal
- explica no PR o que mudou e por quê, com print se mexeu na tela

## combinado

- nada de mandar o token pra outro lugar além do discord
- nada de coletar dado de quem usa
- respeita o delay entre as ações, pra não tomar rate limit nem ban
