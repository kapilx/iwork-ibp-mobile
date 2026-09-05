export const AZURE_SEARCH_INDEX_FIELDS = [
    {
      name: "id",
      type: "Edm.String",
      key: true,
      searchable: true,
      filterable: true
    },
    {
      name: "documentId",
      type: "Edm.String",
      searchable: true,
      filterable: true
    },
    {
      name: "fileName",
      type: "Edm.String",
      searchable: true,
      filterable: true,
      sortable: true
    },
    {
      name: "content",
      type: "Edm.String",
      searchable: true,
      filterable: false
    },
    {
      name: "pageCount",
      type: "Edm.Int32",
      searchable: false,
      filterable: true,
      sortable: true
    },
    {
      name: "pageNumber",
      type: "Edm.Int32",
      searchable: false,
      filterable: true,
      sortable: true
    },
    {
      name: "pageContent",
      type: "Edm.String",
      searchable: true,
      filterable: false
    },
    {
      name: "paragraphs",
      type: "Collection(Edm.String)",
      searchable: true,
      filterable: false
    },
    {
      name: "documentPath",
      type: "Edm.String",
      searchable: false,
      filterable: false
    },
    {
      name: "uploadDate",
      type: "Edm.DateTimeOffset",
      searchable: false,
      filterable: true,
      sortable: true
    },
    {
      name: "language",
      type: "Edm.String",
      searchable: false,
      filterable: true,
      sortable: true
    },
    {
      name: "documentType",
      type: "Edm.String",
      searchable: false,
      filterable: true,
      sortable: true
    },
    {
      name: "tables",
      type: "Collection(Edm.String)",
      searchable: true,
      filterable: false
    }
  ];