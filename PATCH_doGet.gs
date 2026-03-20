// ══════════════════════════════════════════════════════════════
// PATCH doGet — adicione estas linhas no switch do doGet
// Logo antes da linha:  default: result=_err('Ação inválida: '+action);
// ══════════════════════════════════════════════════════════════
//
// Se você preferir, substitua a linha default por este bloco completo:
//
//       case 'getModulosStatus':     result = getModulosStatus();              break;
//       case 'setModuloStatus':      result = setModuloStatus(params);         break;
//       case 'getComissaoDetalhe':   result = handleGetComissaoDetalhe(params);break;
//       case 'getMinhasComissoes':   result = handleGetMinhasComissoes(params); break;
//       case 'getPerfil':            result = handleGetPerfil(params);          break;
//       case 'atualizarPerfil':      result = handleAtualizarPerfil(params);    break;
//       case 'getFavoritos':         result = handleGetFavoritos(params);       break;
//       case 'toggleFavorito':       result = handleToggleFavorito(params);     break;
//       case 'salvarPushSubscription': result = handleSalvarPush(params);       break;
//       case 'removerPushSubscription':result = handleRemoverPush(params);      break;
//       case 'enviarPushManual':     result = handleEnviarPushManual(params);   break;
//       default:                     result = _err('Ação inválida: ' + action);
//
// ATENÇÃO: o case 'getComissoes' já deve existir no seu switch original.
// Não duplique — verifique antes de adicionar.

// ── TAMBÉM adicione no objeto ABA (no início do Code.gs) ──────
// Após a linha:  COMISSAO_MEMBROS:'COMISSAO_MEMBROS',
// Adicione:
//   FAVORITOS:          'FAVORITOS',
//   PUSH_SUBSCRIPTIONS: 'PUSH_SUBSCRIPTIONS',
