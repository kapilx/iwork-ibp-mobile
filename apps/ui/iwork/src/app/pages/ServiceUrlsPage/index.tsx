import React, { useMemo, useState } from "react";
import { Table, SmartSearch, useFormWatcher, environment, sanitizeUrl } from "@ui/ui-lib";
import {
    ServiceUrlsContainer,
    ServiceUrlsTitle,
    SwaggerLink,
} from "./styles";

const SERVICES = [
    { key: "org-service", name: "Org Service" },
    { key: "opportunity-service", name: "Opportunity Service" },
    { key: "policy-service", name: "Policy Service" },
    { key: "knowledge-service", name: "Knowledge Service" },
    { key: "notification-service", name: "Notification Service" },
    { key: "ai-service", name: "Ai Service" },
    { key: "document-service", name: "Document Service" },
    { key: "ibp-service", name: "Ibp Service" },
    { key: "config-service", name: "Config Service" },
    { key: "auth-service", name: "Auth Service" },
];

const getBaseUrl = () => {
    return environment.swaggerGatewayUrl;
};

const LinkCellRenderer = (params: any) => {
    if (!params.value) return null;
    return (
        <SwaggerLink
            href={sanitizeUrl(params.value)}
            target="_blank"
            rel="noopener noreferrer"
        >
            {params.value}
        </SwaggerLink>
    );
};

const ServiceUrlsPage: React.FC = () => {
    const baseUrl = useMemo(() => getBaseUrl(), []);
    const [searchTerm, setSearchTerm] = useState("");
    const [sort, setSort] = useState<{ colId: string; sort: "asc" | "desc" }[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [formMethods, setFormMethods] = useState<any>();

    const searchDefaultValues = useMemo(() => ({ search: "" }), []);

    const { selectedValues, handleReset } = useFormWatcher({
        formMethods,
        setSearchTerm,
        searchFieldName: "search",
        searchDefaultValues,
    });

    const rowData = useMemo(() => {
        let data = SERVICES.map((service, index) => ({
            id: index,
            serviceName: service.name,
            url: `${baseUrl}/${service.key}/api/docs`,
        }));

        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            data = data.filter(item =>
                item.serviceName.toLowerCase().includes(lowSearch) ||
                item.url.toLowerCase().includes(lowSearch)
            );
        }

        if (sort.length > 0) {
            const { colId, sort: direction } = sort[0];
            data.sort((a, b) => {
                const aVal = (a[colId as keyof typeof a] ?? "").toString().toLowerCase();
                const bVal = (b[colId as keyof typeof b] ?? "").toString().toLowerCase();
                if (aVal === bVal) return 0;
                const result = aVal > bVal ? 1 : -1;
                return direction === "asc" ? result : -result;
            });
        }
        return data;
    }, [baseUrl, sort, searchTerm]);

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return rowData.slice(startIndex, startIndex + pageSize);
    }, [rowData, currentPage, pageSize]);

    const columns = useMemo(() => [
        {
            headerName: "S.No",
            valueGetter: (params: any) => params.node.rowIndex + 1,
            width: 80,
            sortable: false,
        },
        {
            headerName: "Service Name",
            field: "serviceName",
            minWidth: 250,
            filter: false,
            sortable: true,
        },
        {
            headerName: "Service Catalog",
            field: "url",
            minWidth: 450,
            flex: 1,
            cellRenderer: "LinkCellRenderer",
            filter: false,
            sortable: true,
        },
    ], []);

    return (
        <ServiceUrlsContainer>
            <ServiceUrlsTitle variant="h1">Service Catalog</ServiceUrlsTitle>

            <SmartSearch
                searchFormConfig={[]}
                searchDefaultValues={searchDefaultValues}
                searchFormMethods={setFormMethods}
                formMethods={formMethods}
                selectedValues={selectedValues}
                searchFieldName="search"
                placeholder="Search by Service Name or URL..."
                onReset={handleReset}
                title={null}
            />

            <Table
                columns={columns}
                rowData={paginatedData}
                totalRows={rowData.length}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50, 100]}
                setPageSize={setPageSize}
                loading={false}
                showLoader={false}
                enableSaveView={false}
                showRefreshButton={false}
                displaySettingsButton={false}
                onCellClicked={() => { }}
                setSort={setSort}
                components={{ LinkCellRenderer }}
            />
        </ServiceUrlsContainer>
    );
};

export default ServiceUrlsPage;
