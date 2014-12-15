#Venom *by [dp6](http://www.dp6.com.br/)*

## Syntax Indentation
Use [JsFormat](https://github.com/jdc0589/JsFormat) with the following settings

```json
{
	"indent_with_tabs": true,
	"preserve_newlines": true,
	"jslint_happy": true,
	"keep_function_indentation": false,
	"break_chained_methods": false
}
```

## Plugins
- gaHitHook.js
- copyCookie.js
- timeOnPage.js
- trackForm.js
- trackYoutube.js
- mirrorTracker.js

### Todo
- Amostragem: Opcionalmente limitar a execução dos plugins a uma porcentagem dos usuários
- Modo Debug: Ativar logs em pontos cruciais de execução para facilitar o entendimento da *Venom*
- Otimização: Externalizar as funções mais usadas do util para que sejam otimizadas pelo minificador