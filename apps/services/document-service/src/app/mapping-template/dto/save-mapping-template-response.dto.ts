export class SaveMappingTemplateResponseDto {
    status!: string;
    mapping_template_version_id!: number;
    template_version_no!: number;
    message!: string;

    constructor(
        mappingTemplateVersionId: number,
        templateVersionNo: number,
        message = 'Mapping template saved successfully'
    ) {
        this.status = 'SUCCESS';
        this.mapping_template_version_id = mappingTemplateVersionId;
        this.template_version_no = templateVersionNo;
        this.message = message;
    }
}
