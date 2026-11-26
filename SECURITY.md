# segurança

## achou uma falha?

não abre issue pública. manda pelo [relato privado de vulnerabilidade](https://github.com/rehfofazap/tomalerda/security/advisories/new), só eu vejo.

conta o que dá pra fazer com a falha e como repetir. respondo assim que der.

## o que conta como falha

- o token vazando pra algum lugar que não seja o próprio discord
- o app baixando ou rodando coisa que não devia (atualização falsa, por exemplo)
- algo que deixe outra pessoa mexer na sua conta pelo app

bug comum (botão que não funciona, tela quebrada, mensagem que não apagou) pode abrir [issue normal](https://github.com/rehfofazap/tomalerda/issues/new/choose).

## como o app cuida das coisas

- o token fica no cofre do windows (gerenciador de credenciais), não em arquivo
- o app só conversa com `discord.com` e com o endereço de atualização (`rehbet.com.br/tomalerda`)
- toda atualização é assinada; o app confere a assinatura antes de instalar e recusa se não bater
- o sha256 de cada instalador fica nas notas da [release](https://github.com/rehfofazap/tomalerda/releases)

## versões

só a última versão recebe correção. o app atualiza sozinho, então é só deixar ele aberto um pouco.
