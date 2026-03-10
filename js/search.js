/**
 * search.js — Módulo de busca e filtragem de documentos
 * ──────────────────────────────────────────────────────
 * Toda a lógica de filtro fica aqui, sem tocar no DOM.
 * A função principal recebe o array bruto e os critérios
 * e retorna o array filtrado.
 *
 * Secretaria Executiva CMS-MOC | Versão 1.0
 */

const Search = (() => {

  /**
   * filter(documentos, criterios)
   * ─────────────────────────────────────────────────────────
   * @param {Array}  documentos  - Array de objetos documento
   * @param {Object} criterios   - { texto, tipo, ano }
   * @returns {Array}            - Array filtrado e ordenado
   */
  function filter(documentos, criterios = {}) {
    const { texto = '', tipo = '', ano = '' } = criterios;

    const query = _normalizar(texto);

    return documentos.filter(doc => {
      // Filtro por tipo
      if (tipo && _normalizar(doc.tipo) !== _normalizar(tipo)) return false;

      // Filtro por ano
      if (ano && String(doc.ano) !== String(ano)) return false;

      // Filtro por texto (busca em título e descrição)
      if (query) {
        const titulo    = _normalizar(doc.titulo    || '');
        const descricao = _normalizar(doc.descricao || '');
        const tipoDoc   = _normalizar(doc.tipo      || '');
        if (!titulo.includes(query) && !descricao.includes(query) && !tipoDoc.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * getAnos(documentos)
   * ─────────────────────────────────────────────────────────
   * Extrai anos únicos e ordenados dos documentos.
   */
  function getAnos(documentos) {
    const anos = [...new Set(documentos.map(d => d.ano).filter(Boolean))];
    return anos.sort((a, b) => b - a); // Mais recente primeiro
  }

  /**
   * getTipos(documentos)
   * ─────────────────────────────────────────────────────────
   * Extrai tipos únicos dos documentos.
   */
  function getTipos(documentos) {
    return [...new Set(documentos.map(d => d.tipo).filter(Boolean))].sort();
  }

  /**
   * _normalizar(str)
   * ─────────────────────────────────────────────────────────
   * Remove acentos e converte para minúsculas para busca
   * sem sensibilidade a acentuação.
   */
  function _normalizar(str) {
    return String(str)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // ── API pública ───────────────────────────────────────────
  return {
    filter,
    getAnos,
    getTipos,
  };

})();
