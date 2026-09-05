# Policy Features - Technical Specification

**JIRA ID:** IIRM-7931  
**Version:** 1.0  
**Date:** November 24, 2025  
**Status:** Draft

---

## 1. Technical Overview

### 1.1 Architecture Pattern
This feature follows the established microservices architecture with:

- **Backend Services**: Policy Service (existing) + Document Service (existing)
- **Frontend Applications**: IWORK (admin portal) + IBP (employee portal)
- **Database**: PostgreSQL with TypeORM entities
- **File Storage**: Document Service with file management capabilities
- **Communication**: HTTP REST APIs via API Gateway

### 1.2 Technology Stack Reuse
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Frontend**: React 18, TypeScript, Material-UI, Redux Toolkit
- **File Handling**: Existing `FileUploadWrapper` and `DisplayUploadedFile` components
- **State Management**: Redux with existing slice patterns
- **API Communication**: Existing `useApiQuery` and `apiRequest` utilities

---

## 2. Database Design

### 2.1 New Entities

#### PolicyFeatureDocument Entity

```typescript
// apps/services/policy-service/src/app/policy/entities/policy-feature-document.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('policy_feature_documents')
export class PolicyFeatureDocument {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'policy_id', type: 'varchar', length: 255 })
    policyId: string;

    @Column({ name: 'document_id', type: 'varchar', length: 255 })
    documentId: string;

    @Column({ name: 'file_name', type: 'varchar', length: 500 })
    fileName: string;

    @Column({ name: 'original_file_name', type: 'varchar', length: 500 })
    originalFileName: string;

    @Column({ name: 'file_size', type: 'bigint' })
    fileSize: number;

    @Column({ name: 'mime_type', type: 'varchar', length: 100, default: 'application/pdf' })
    mimeType: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'uploaded_by', type: 'varchar', length: 255 })
    uploadedBy: string;

    @Column({ name: 'uploaded_by_name', type: 'varchar', length: 255 })
    uploadedByName: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'replaced_at', type: 'timestamp', nullable: true })
    replacedAt: Date;

    @Column({ name: 'status', type: 'varchar', length: 50, default: 'active' })
    status: 'active' | 'replaced' | 'deleted';
}
```

### 2.2 Migration Script

```typescript
// database-migrations/AddPolicyFeatureDocumentsTable{timestamp}.ts

import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddPolicyFeatureDocumentsTable{timestamp} implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'policy_feature_documents',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'policy_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'document_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'file_name',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'original_file_name',
                        type: 'varchar',
                        length: '500',
                        isNullable: false,
                    },
                    {
                        name: 'file_size',
                        type: 'bigint',
                        isNullable: false,
                    },
                    {
                        name: 'mime_type',
                        type: 'varchar',
                        length: '100',
                        default: "'application/pdf'",
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'uploaded_by',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'uploaded_by_name',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        onUpdate: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'replaced_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        length: '50',
                        default: "'active'",
                    },
                ],
            })
        );

        await queryRunner.createIndex('policy_feature_documents', new Index('IDX_POLICY_FEATURE_DOCUMENTS_POLICY_ID', ['policy_id']));
        await queryRunner.createIndex('policy_feature_documents', new Index('IDX_POLICY_FEATURE_DOCUMENTS_STATUS', ['status']));
        await queryRunner.createIndex('policy_feature_documents', new Index('IDX_POLICY_FEATURE_DOCUMENTS_ACTIVE', ['is_active']));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('policy_feature_documents');
    }
}
```

---

## 3. Backend Implementation

### 3.1 Policy Service - DTOs

#### Upload Policy Feature Document DTO

```typescript
// apps/services/policy-service/src/app/policy/dto/upload-policy-feature.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class UploadPolicyFeatureDto {
    @ApiProperty({ description: 'Policy ID' })
    @IsString()
    @IsNotEmpty()
    policyId: string;

    @ApiProperty({ description: 'Document ID from document service' })
    @IsString()
    @IsNotEmpty()
    documentId: string;

    @ApiProperty({ description: 'Original file name' })
    @IsString()
    @IsNotEmpty()
    originalFileName: string;

    @ApiProperty({ description: 'File size in bytes' })
    @IsString()
    @IsNotEmpty()
    fileSize: string;

    @ApiProperty({ description: 'Uploaded by user ID' })
    @IsString()
    @IsNotEmpty()
    uploadedBy: string;

    @ApiProperty({ description: 'Uploaded by user name' })
    @IsString()
    @IsNotEmpty()
    uploadedByName: string;
}
```

#### Policy Feature Response DTO

```typescript
// apps/services/policy-service/src/app/policy/dto/policy-feature-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class PolicyFeatureResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    policyId: string;

    @ApiProperty()
    documentId: string;

    @ApiProperty()
    fileName: string;

    @ApiProperty()
    originalFileName: string;

    @ApiProperty()
    fileSize: number;

    @ApiProperty()
    mimeType: string;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    uploadedBy: string;

    @ApiProperty()
    uploadedByName: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty()
    status: string;
}
```

### 3.2 Policy Service - Repository

```typescript
// apps/services/policy-service/src/app/policy/policy-feature.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PolicyFeatureDocument } from './entities/policy-feature-document.entity';
import { UploadPolicyFeatureDto } from './dto/upload-policy-feature.dto';

@Injectable()
export class PolicyFeatureRepository {
    constructor(
        @InjectRepository(PolicyFeatureDocument)
        private readonly policyFeatureDocumentRepository: Repository<PolicyFeatureDocument>
    ) {}

    async uploadPolicyFeature(uploadDto: UploadPolicyFeatureDto): Promise<PolicyFeatureDocument> {
        // Deactivate previous active document
        await this.policyFeatureDocumentRepository.update(
            { policyId: uploadDto.policyId, isActive: true },
            { 
                isActive: false, 
                status: 'replaced',
                replacedAt: new Date()
            }
        );

        // Create new active document
        const policyFeatureDocument = this.policyFeatureDocumentRepository.create({
            ...uploadDto,
            fileSize: parseInt(uploadDto.fileSize),
            fileName: uploadDto.originalFileName,
            isActive: true,
            status: 'active',
            mimeType: 'application/pdf'
        });

        return this.policyFeatureDocumentRepository.save(policyFeatureDocument);
    }

    async getActivePolicyFeature(policyId: string): Promise<PolicyFeatureDocument> {
        return this.policyFeatureDocumentRepository.findOne({
            where: { 
                policyId, 
                isActive: true,
                status: 'active'
            }
        });
    }

    async getPolicyFeatureHistory(policyId: string): Promise<PolicyFeatureDocument[]> {
        return this.policyFeatureDocumentRepository.find({
            where: { policyId },
            order: { createdAt: 'DESC' }
        });
    }

    async deletePolicyFeature(policyId: string, documentId: string): Promise<void> {
        await this.policyFeatureDocumentRepository.update(
            { policyId, documentId, isActive: true },
            { 
                isActive: false, 
                status: 'deleted',
                replacedAt: new Date()
            }
        );
    }
}
```

### 3.3 Policy Service - Service Layer

```typescript
// apps/services/policy-service/src/app/policy/policy-feature.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PolicyFeatureRepository } from './policy-feature.repository';
import { UploadPolicyFeatureDto } from './dto/upload-policy-feature.dto';
import { PolicyFeatureResponseDto } from './dto/policy-feature-response.dto';
import { HttpService } from '@nestjs/axios';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PolicyFeatureService {
    constructor(
        private readonly policyFeatureRepository: PolicyFeatureRepository,
        private readonly httpService: HttpService
    ) {}

    async uploadPolicyFeature(uploadDto: UploadPolicyFeatureDto): Promise<PolicyFeatureResponseDto> {
        // Validate file exists in document service
        try {
            const documentResponse = await firstValueFrom(
                this.httpService.get(`${ENV.URL_DOCUMENT_SERVICE}/api/documents/${uploadDto.documentId}`)
            );
            
            if (!documentResponse.data) {
                throw new BadRequestException('Document not found in document service');
            }
        } catch (error) {
            throw new BadRequestException('Invalid document ID');
        }

        const policyFeatureDocument = await this.policyFeatureRepository.uploadPolicyFeature(uploadDto);
        
        return this.mapToResponseDto(policyFeatureDocument);
    }

    async getPolicyFeature(policyId: string): Promise<PolicyFeatureResponseDto | null> {
        const policyFeature = await this.policyFeatureRepository.getActivePolicyFeature(policyId);
        
        if (!policyFeature) {
            return null;
        }

        return this.mapToResponseDto(policyFeature);
    }

    async getPolicyFeatureHistory(policyId: string): Promise<PolicyFeatureResponseDto[]> {
        const history = await this.policyFeatureRepository.getPolicyFeatureHistory(policyId);
        return history.map(doc => this.mapToResponseDto(doc));
    }

    async getDocumentDownloadUrl(policyId: string): Promise<string> {
        const policyFeature = await this.policyFeatureRepository.getActivePolicyFeature(policyId);
        
        if (!policyFeature) {
            throw new NotFoundException('Policy feature document not found');
        }

        return `${ENV.URL_DOCUMENT_SERVICE}/api/documents/${policyFeature.documentId}/download`;
    }

    private mapToResponseDto(document: any): PolicyFeatureResponseDto {
        return {
            id: document.id,
            policyId: document.policyId,
            documentId: document.documentId,
            fileName: document.fileName,
            originalFileName: document.originalFileName,
            fileSize: document.fileSize,
            mimeType: document.mimeType,
            isActive: document.isActive,
            uploadedBy: document.uploadedBy,
            uploadedByName: document.uploadedByName,
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
            status: document.status
        };
    }
}
```

### 3.4 Policy Service - Controller

```typescript
// apps/services/policy-service/src/app/policy/policy-feature.controller.ts

import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PolicyFeatureService } from './policy-feature.service';
import { UploadPolicyFeatureDto } from './dto/upload-policy-feature.dto';
import { PolicyFeatureResponseDto } from './dto/policy-feature-response.dto';
import { AuthGuard } from '../../../../service-lib/src/lib/auth.guard';

@ApiTags('Policy Features')
@Controller('policy-features')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class PolicyFeatureController {
    constructor(private readonly policyFeatureService: PolicyFeatureService) {}

    @Post(':policyId/upload')
    @ApiOperation({ summary: 'Upload policy feature document' })
    @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: PolicyFeatureResponseDto })
    @ApiResponse({ status: 400, description: 'Bad Request' })
    async uploadPolicyFeature(
        @Param('policyId') policyId: string,
        @Body() uploadDto: UploadPolicyFeatureDto,
        @Req() req: any
    ): Promise<PolicyFeatureResponseDto> {
        uploadDto.policyId = policyId;
        uploadDto.uploadedBy = req.user?.userId || req.user?.id;
        uploadDto.uploadedByName = req.user?.name || `${req.user?.firstName} ${req.user?.lastName}`;
        
        return this.policyFeatureService.uploadPolicyFeature(uploadDto);
    }

    @Get(':policyId')
    @ApiOperation({ summary: 'Get active policy feature document' })
    @ApiResponse({ status: 200, description: 'Policy feature document retrieved', type: PolicyFeatureResponseDto })
    @ApiResponse({ status: 404, description: 'Document not found' })
    async getPolicyFeature(@Param('policyId') policyId: string): Promise<PolicyFeatureResponseDto | null> {
        return this.policyFeatureService.getPolicyFeature(policyId);
    }

    @Get(':policyId/history')
    @ApiOperation({ summary: 'Get policy feature document history' })
    @ApiResponse({ status: 200, description: 'Policy feature history retrieved', type: [PolicyFeatureResponseDto] })
    async getPolicyFeatureHistory(@Param('policyId') policyId: string): Promise<PolicyFeatureResponseDto[]> {
        return this.policyFeatureService.getPolicyFeatureHistory(policyId);
    }

    @Get(':policyId/download-url')
    @ApiOperation({ summary: 'Get document download URL' })
    @ApiResponse({ status: 200, description: 'Download URL retrieved' })
    async getDownloadUrl(@Param('policyId') policyId: string): Promise<{ downloadUrl: string }> {
        const downloadUrl = await this.policyFeatureService.getDocumentDownloadUrl(policyId);
        return { downloadUrl };
    }
}
```

### 3.5 Policy Service - Module Updates

```typescript
// apps/services/policy-service/src/app/policy/policy-feature.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PolicyFeatureController } from './policy-feature.controller';
import { PolicyFeatureService } from './policy-feature.service';
import { PolicyFeatureRepository } from './policy-feature.repository';
import { PolicyFeatureDocument } from './entities/policy-feature-document.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PolicyFeatureDocument]),
        HttpModule
    ],
    controllers: [PolicyFeatureController],
    providers: [PolicyFeatureService, PolicyFeatureRepository],
    exports: [PolicyFeatureService, PolicyFeatureRepository]
})
export class PolicyFeatureModule {}
```

```typescript
// Update apps/services/policy-service/src/app/app.module.ts

import { PolicyFeatureModule } from './policy/policy-feature.module';

@Module({
  imports: [
    // ... existing imports
    PolicyFeatureModule,
  ],
  // ... rest of the module
})
export class AppModule implements OnModuleInit {
  // ... existing implementation
}
```

---

## 4. Frontend Implementation

### 4.1 Admin Portal (IWORK) - Types

```typescript
// apps/ui/iwork/src/app/types/policy-feature.types.ts

export interface PolicyFeatureDocument {
    id: string;
    policyId: string;
    documentId: string;
    fileName: string;
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    isActive: boolean;
    uploadedBy: string;
    uploadedByName: string;
    createdAt: string;
    updatedAt: string;
    status: 'active' | 'replaced' | 'deleted';
}

export interface UploadPolicyFeatureRequest {
    documentId: string;
    originalFileName: string;
    fileSize: string;
    uploadedBy: string;
    uploadedByName: string;
}

export interface PolicyFeatureUploadResponse {
    success: boolean;
    data?: PolicyFeatureDocument;
    error?: string;
}
```

### 4.2 Admin Portal - API Service

```typescript
// apps/ui/iwork/src/app/services/policy-feature.service.ts

import { apiRequest } from '@ui/ui-lib/utils/apiRequest';
import { endPoints } from '@ui/ui-lib/constants/endPoints';
import { 
    PolicyFeatureDocument, 
    UploadPolicyFeatureRequest,
    PolicyFeatureUploadResponse 
} from '../types/policy-feature.types';

export class PolicyFeatureService {
    static async uploadPolicyFeature(
        policyId: string, 
        uploadData: UploadPolicyFeatureRequest
    ): Promise<PolicyFeatureUploadResponse> {
        try {
            const response = await apiRequest(`${endPoints.policyFeatures}/${policyId}/upload`, {
                method: 'POST',
                data: uploadData
            });
            return { success: true, data: response.data };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }

    static async getPolicyFeature(policyId: string): Promise<PolicyFeatureDocument | null> {
        try {
            const response = await apiRequest(`${endPoints.policyFeatures}/${policyId}`);
            return response.data;
        } catch (error) {
            return null;
        }
    }

    static async getPolicyFeatureHistory(policyId: string): Promise<PolicyFeatureDocument[]> {
        try {
            const response = await apiRequest(`${endPoints.policyFeatures}/${policyId}/history`);
            return response.data || [];
        } catch (error) {
            return [];
        }
    }

    static async getDownloadUrl(policyId: string): Promise<string | null> {
        try {
            const response = await apiRequest(`${endPoints.policyFeatures}/${policyId}/download-url`);
            return response.data.downloadUrl;
        } catch (error) {
            return null;
        }
    }
}
```

### 4.3 Admin Portal - Upload Policy Features Card Component

```typescript
// apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/UploadPolicyFeaturesCard/index.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Typography, Box, CircularProgress } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setToastMessage } from '@ui/ui-lib/redux/slice';
import { PolicyFeatureService } from '../../../../services/policy-feature.service';
import { PolicyFeatureDocument } from '../../../../types/policy-feature.types';
import FileUploadWrapper from '@ui/ui-lib/commonComponents/FileUploadWrapper';
import PolicyFeatureViewer from '../PolicyFeatureViewer';
import { 
    StyledCard, 
    StatusChip, 
    ActionButtonsContainer,
    InfoRow,
    InfoLabel,
    InfoValue
} from './styles';

interface UploadPolicyFeaturesCardProps {
    policyId: string;
}

const UploadPolicyFeaturesCard: React.FC<UploadPolicyFeaturesCardProps> = ({ policyId }) => {
    const dispatch = useDispatch();
    const [policyFeature, setPolicyFeature] = useState<PolicyFeatureDocument | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showViewer, setShowViewer] = useState(false);

    useEffect(() => {
        loadPolicyFeature();
    }, [policyId]);

    const loadPolicyFeature = async () => {
        setLoading(true);
        try {
            const data = await PolicyFeatureService.getPolicyFeature(policyId);
            setPolicyFeature(data);
        } catch (error) {
            console.error('Error loading policy feature:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (uploadedFileData: any) => {
        setUploading(true);
        try {
            const uploadData = {
                documentId: uploadedFileData.id,
                originalFileName: uploadedFileData.fileName,
                fileSize: uploadedFileData.fileSize.toString(),
                uploadedBy: '', // Will be set by backend from token
                uploadedByName: '' // Will be set by backend from token
            };

            const response = await PolicyFeatureService.uploadPolicyFeature(policyId, uploadData);
            
            if (response.success) {
                setPolicyFeature(response.data || null);
                setShowUploadModal(false);
                dispatch(setToastMessage('Policy features document uploaded successfully'));
            } else {
                dispatch(setToastMessage(response.error || 'Upload failed'));
            }
        } catch (error: any) {
            dispatch(setToastMessage(error.message || 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const handleReplaceConfirmation = () => {
        const confirmReplace = window.confirm(
            'Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?'
        );
        
        if (confirmReplace) {
            setShowUploadModal(true);
        }
    };

    if (loading) {
        return (
            <StyledCard>
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="150px">
                        <CircularProgress />
                    </Box>
                </CardContent>
            </StyledCard>
        );
    }

    return (
        <>
            <StyledCard>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Policy Features</Typography>
                        {policyFeature && (
                            <StatusChip 
                                label="Document Uploaded" 
                                color="success" 
                                size="small"
                            />
                        )}
                        {!policyFeature && (
                            <StatusChip 
                                label="Not Uploaded" 
                                color="default" 
                                size="small"
                            />
                        )}
                    </Box>

                    {!policyFeature && (
                        <Typography variant="body2" color="textSecondary" mb={2}>
                            Upload policy features document for employees
                        </Typography>
                    )}

                    <Box mb={2}>
                        <InfoRow>
                            <InfoLabel>Last Uploaded:</InfoLabel>
                            <InfoValue>
                                {policyFeature 
                                    ? new Date(policyFeature.createdAt).toLocaleDateString() 
                                    : '-'
                                }
                            </InfoValue>
                        </InfoRow>
                        <InfoRow>
                            <InfoLabel>Uploader Name:</InfoLabel>
                            <InfoValue>
                                {policyFeature?.uploadedByName || '-'}
                            </InfoValue>
                        </InfoRow>
                    </Box>

                    <ActionButtonsContainer>
                        {!policyFeature && (
                            <Button 
                                variant="contained" 
                                color="primary"
                                onClick={() => setShowUploadModal(true)}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload File'}
                            </Button>
                        )}
                        
                        {policyFeature && (
                            <>
                                <Button 
                                    variant="outlined" 
                                    color="primary"
                                    onClick={handleReplaceConfirmation}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading...' : 'Replace Document'}
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="secondary"
                                    onClick={() => setShowViewer(true)}
                                >
                                    View
                                </Button>
                            </>
                        )}
                    </ActionButtonsContainer>
                </CardContent>
            </StyledCard>

            {showUploadModal && (
                <FileUploadWrapper
                    formConfig={{
                        fields: [{
                            name: 'file',
                            type: 'file',
                            label: 'Upload PDF File',
                            required: true,
                            accept: '.pdf',
                            maxSize: 25 * 1024 * 1024, // 25MB
                            validation: {
                                required: 'Please select a PDF file'
                            }
                        }],
                        onSubmit: handleFileUpload,
                        onCancel: () => setShowUploadModal(false)
                    }}
                />
            )}

            {showViewer && policyFeature && (
                <PolicyFeatureViewer
                    policyFeature={policyFeature}
                    policyId={policyId}
                    onClose={() => setShowViewer(false)}
                />
            )}
        </>
    );
};

export default UploadPolicyFeaturesCard;
```

### 4.4 Admin Portal - Policy Feature Viewer Component

```typescript
// apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyFeatureViewer/index.tsx

import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Box,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    IconButton
} from '@mui/material';
import { Download, History } from '@mui/icons-material';
import { PolicyFeatureDocument } from '../../../../types/policy-feature.types';
import { PolicyFeatureService } from '../../../../services/policy-feature.service';
import { apiRequest } from '@ui/ui-lib/utils/apiRequest';

interface PolicyFeatureViewerProps {
    policyFeature: PolicyFeatureDocument;
    policyId: string;
    onClose: () => void;
}

const PolicyFeatureViewer: React.FC<PolicyFeatureViewerProps> = ({ 
    policyFeature, 
    policyId, 
    onClose 
}) => {
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<PolicyFeatureDocument[]>([]);
    const [documentUrl, setDocumentUrl] = useState<string>('');

    useEffect(() => {
        loadDocumentUrl();
    }, [policyFeature]);

    const loadDocumentUrl = async () => {
        try {
            const url = await PolicyFeatureService.getDownloadUrl(policyId);
            if (url) {
                setDocumentUrl(url);
            }
        } catch (error) {
            console.error('Error loading document URL:', error);
        }
    };

    const loadHistory = async () => {
        try {
            const historyData = await PolicyFeatureService.getPolicyFeatureHistory(policyId);
            setHistory(historyData);
            setShowHistory(true);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    const handleDownload = async (documentId?: string) => {
        try {
            const downloadDocId = documentId || policyFeature.documentId;
            const response = await apiRequest(`/api/documents/${downloadDocId}/download`, {
                method: 'GET',
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = policyFeature.originalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    return (
        <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    Policy Features Document
                    <Box>
                        <IconButton onClick={() => handleDownload()} title="Download">
                            <Download />
                        </IconButton>
                        <IconButton onClick={loadHistory} title="Upload History">
                            <History />
                        </IconButton>
                    </Box>
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {!showHistory ? (
                    <Box height="500px" width="100%">
                        {documentUrl && (
                            <iframe
                                src={documentUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title="Policy Features Document"
                            />
                        )}
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="h6" mb={2}>Upload History</Typography>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Document Name</TableCell>
                                    <TableCell>Uploaded By</TableCell>
                                    <TableCell>Timestamp</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {history.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell>{doc.originalFileName}</TableCell>
                                        <TableCell>{doc.uploadedByName}</TableCell>
                                        <TableCell>
                                            {new Date(doc.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Typography 
                                                color={doc.status === 'active' ? 'primary' : 'textSecondary'}
                                            >
                                                {doc.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <IconButton 
                                                onClick={() => handleDownload(doc.documentId)}
                                                size="small"
                                            >
                                                <Download />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>
                )}
            </DialogContent>
            
            <DialogActions>
                {showHistory && (
                    <Button onClick={() => setShowHistory(false)}>
                        Back to Document
                    </Button>
                )}
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PolicyFeatureViewer;
```

### 4.5 Employee Portal (IBP) - Policy Features Button Component

```typescript
// apps/ui/ibp/src/app/pages/DashboardPage/PolicyFeaturesButton/index.tsx

import React from 'react';
import { Button, Box } from '@mui/material';
import { Description } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StyledCard } from './styles';

const PolicyFeaturesButton: React.FC = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/documents?tab=policy-feature');
    };

    return (
        <StyledCard onClick={handleClick}>
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
                <Description fontSize="large" color="primary" />
                <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ mt: 2 }}
                    fullWidth
                >
                    Policy Features
                </Button>
            </Box>
        </StyledCard>
    );
};

export default PolicyFeaturesButton;
```

### 4.6 Employee Portal - Documents Screen Component

```typescript
// apps/ui/ibp/src/app/pages/DocumentsPage/index.tsx

import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Tabs, 
    Tab, 
    IconButton, 
    Button,
    Typography,
    CircularProgress 
} from '@mui/material';
import { Close, Download } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@ui/ui-lib/redux/store';
import { PolicyFeatureService } from '../../services/policy-feature.service';
import { PolicyFeatureDocument } from '../../types/policy-feature.types';
import { 
    DocumentsContainer,
    HeaderContainer,
    TabsContainer,
    SubTabsContainer,
    DocumentViewer,
    PlaceholderContainer
} from './styles';

interface Policy {
    id: string;
    policyNumber: string;
    policyType: string;
    policyName: string;
}

const DocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeMainTab, setActiveMainTab] = useState(searchParams.get('tab') === 'tpa-card' ? 1 : 0);
    const [activeSubTab, setActiveSubTab] = useState(0);
    const [userPolicies, setUserPolicies] = useState<Policy[]>([]);
    const [policyFeatures, setPolicyFeatures] = useState<Record<string, PolicyFeatureDocument>>({});
    const [loading, setLoading] = useState(false);
    const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
    
    const userInfo = useSelector((state: RootState) => state.auth.userInfo);

    useEffect(() => {
        loadUserPolicies();
    }, []);

    useEffect(() => {
        if (userPolicies.length > 0) {
            loadPolicyFeatures();
        }
    }, [userPolicies]);

    const loadUserPolicies = async () => {
        setLoading(true);
        try {
            // API call to get user's enrolled policies
            // This would be implemented based on existing patterns
            const policies: Policy[] = [
                { id: '1', policyNumber: '12345', policyType: 'GMC', policyName: 'Group Medical Care' },
                { id: '2', policyNumber: '67890', policyType: 'GTL', policyName: 'Group Term Life' }
            ];
            setUserPolicies(policies);
        } catch (error) {
            console.error('Error loading policies:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPolicyFeatures = async () => {
        const features: Record<string, PolicyFeatureDocument> = {};
        const urls: Record<string, string> = {};

        for (const policy of userPolicies) {
            try {
                const feature = await PolicyFeatureService.getPolicyFeature(policy.id);
                if (feature) {
                    features[policy.id] = feature;
                    const url = await PolicyFeatureService.getDownloadUrl(policy.id);
                    if (url) {
                        urls[policy.id] = url;
                    }
                }
            } catch (error) {
                console.error(`Error loading feature for policy ${policy.id}:`, error);
            }
        }

        setPolicyFeatures(features);
        setDocumentUrls(urls);
    };

    const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveMainTab(newValue);
    };

    const handleSubTabChange = (index: number) => {
        setActiveSubTab(index);
    };

    const handleDownload = async () => {
        const currentPolicy = userPolicies[activeSubTab];
        const feature = policyFeatures[currentPolicy.id];
        
        if (!feature) return;

        try {
            // Implement download logic using existing patterns
            const response = await fetch(documentUrls[currentPolicy.id]);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = feature.originalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const getCurrentDocument = () => {
        if (userPolicies.length === 0) return null;
        const currentPolicy = userPolicies[activeSubTab];
        
        if (activeMainTab === 0) {
            // Policy Feature tab
            return policyFeatures[currentPolicy.id];
        } else {
            // TPA Card tab - would implement similar logic
            return null;
        }
    };

    const getCurrentDocumentUrl = () => {
        if (userPolicies.length === 0) return '';
        const currentPolicy = userPolicies[activeSubTab];
        return documentUrls[currentPolicy.id] || '';
    };

    if (loading) {
        return (
            <DocumentsContainer>
                <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                    <CircularProgress />
                </Box>
            </DocumentsContainer>
        );
    }

    const currentDocument = getCurrentDocument();
    const currentDocumentUrl = getCurrentDocumentUrl();

    return (
        <DocumentsContainer>
            <HeaderContainer>
                <Typography variant="h5">Documents</Typography>
                <IconButton onClick={() => navigate('/dashboard')}>
                    <Close />
                </IconButton>
            </HeaderContainer>

            <TabsContainer>
                <Tabs value={activeMainTab} onChange={handleMainTabChange}>
                    <Tab label="Policy Feature" />
                    <Tab label="TPA Card" />
                </Tabs>
            </TabsContainer>

            {userPolicies.length > 1 && (
                <SubTabsContainer>
                    {userPolicies.map((policy, index) => (
                        <Button
                            key={policy.id}
                            variant={activeSubTab === index ? "contained" : "outlined"}
                            onClick={() => handleSubTabChange(index)}
                            sx={{ mr: 1 }}
                        >
                            #{policy.policyNumber} - {policy.policyType}
                        </Button>
                    ))}
                </SubTabsContainer>
            )}

            <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
                <Typography variant="h6">
                    {activeMainTab === 0 ? 'Policy Features' : 'TPA Card'}
                </Typography>
                {currentDocument && (
                    <Button
                        startIcon={<Download />}
                        onClick={handleDownload}
                        variant="outlined"
                    >
                        Download
                    </Button>
                )}
            </Box>

            <DocumentViewer>
                {currentDocument && currentDocumentUrl ? (
                    <iframe
                        src={currentDocumentUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Document Viewer"
                    />
                ) : (
                    <PlaceholderContainer>
                        <Typography variant="body1" color="textSecondary">
                            Features document for this policy will be available soon
                        </Typography>
                    </PlaceholderContainer>
                )}
            </DocumentViewer>
        </DocumentsContainer>
    );
};

export default DocumentsPage;
```

---

## 5. API Endpoints Summary

### 5.1 Policy Service Endpoints

```
POST /api/policy-features/{policyId}/upload
GET  /api/policy-features/{policyId}
GET  /api/policy-features/{policyId}/history
GET  /api/policy-features/{policyId}/download-url
```

### 5.2 Document Service Endpoints (Existing)

```
POST /api/documents/upload
GET  /api/documents/{documentId}
GET  /api/documents/{documentId}/download
DELETE /api/documents/{documentId}
```

---

## 6. Testing Strategy

### 6.1 Backend Unit Tests

```typescript
// apps/services/policy-service/src/app/policy/policy-feature.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { PolicyFeatureService } from './policy-feature.service';
import { PolicyFeatureRepository } from './policy-feature.repository';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PolicyFeatureService', () => {
    let service: PolicyFeatureService;
    let repository: PolicyFeatureRepository;
    let httpService: HttpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PolicyFeatureService,
                {
                    provide: PolicyFeatureRepository,
                    useValue: {
                        uploadPolicyFeature: jest.fn(),
                        getActivePolicyFeature: jest.fn(),
                        getPolicyFeatureHistory: jest.fn(),
                    },
                },
                {
                    provide: HttpService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<PolicyFeatureService>(PolicyFeatureService);
        repository = module.get<PolicyFeatureRepository>(PolicyFeatureRepository);
        httpService = module.get<HttpService>(HttpService);
    });

    describe('uploadPolicyFeature', () => {
        it('should upload policy feature successfully', async () => {
            const uploadDto = {
                policyId: 'policy-1',
                documentId: 'doc-1',
                originalFileName: 'policy-features.pdf',
                fileSize: '1024000',
                uploadedBy: 'user-1',
                uploadedByName: 'John Doe',
            };

            const mockDocument = {
                id: 'feature-1',
                ...uploadDto,
                fileSize: 1024000,
                isActive: true,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            jest.spyOn(httpService, 'get').mockReturnValue(
                Promise.resolve({ data: { id: 'doc-1' } }) as any
            );
            jest.spyOn(repository, 'uploadPolicyFeature').mockResolvedValue(mockDocument as any);

            const result = await service.uploadPolicyFeature(uploadDto);

            expect(result.policyId).toBe(uploadDto.policyId);
            expect(result.documentId).toBe(uploadDto.documentId);
        });

        it('should throw BadRequestException for invalid document', async () => {
            const uploadDto = {
                policyId: 'policy-1',
                documentId: 'invalid-doc',
                originalFileName: 'policy-features.pdf',
                fileSize: '1024000',
                uploadedBy: 'user-1',
                uploadedByName: 'John Doe',
            };

            jest.spyOn(httpService, 'get').mockRejectedValue(new Error('Document not found'));

            await expect(service.uploadPolicyFeature(uploadDto)).rejects.toThrow(BadRequestException);
        });
    });

    describe('getPolicyFeature', () => {
        it('should return policy feature when exists', async () => {
            const mockFeature = {
                id: 'feature-1',
                policyId: 'policy-1',
                documentId: 'doc-1',
                fileName: 'policy-features.pdf',
                isActive: true,
            };

            jest.spyOn(repository, 'getActivePolicyFeature').mockResolvedValue(mockFeature as any);

            const result = await service.getPolicyFeature('policy-1');

            expect(result).toBeDefined();
            expect(result?.policyId).toBe('policy-1');
        });

        it('should return null when no policy feature exists', async () => {
            jest.spyOn(repository, 'getActivePolicyFeature').mockResolvedValue(null);

            const result = await service.getPolicyFeature('policy-1');

            expect(result).toBeNull();
        });
    });
});
```

### 6.2 Frontend Component Tests

```typescript
// apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/UploadPolicyFeaturesCard/index.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@ui/ui-lib/redux/store';
import UploadPolicyFeaturesCard from './index';
import { PolicyFeatureService } from '../../../../services/policy-feature.service';

jest.mock('../../../../services/policy-feature.service');

const MockedPolicyFeatureService = PolicyFeatureService as jest.Mocked<typeof PolicyFeatureService>;

const renderComponent = (policyId: string = 'test-policy-1') => {
    return render(
        <Provider store={store}>
            <UploadPolicyFeaturesCard policyId={policyId} />
        </Provider>
    );
};

describe('UploadPolicyFeaturesCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render upload button when no document exists', async () => {
        MockedPolicyFeatureService.getPolicyFeature.mockResolvedValue(null);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Upload File')).toBeInTheDocument();
        });

        expect(screen.getByText('Not Uploaded')).toBeInTheDocument();
        expect(screen.getByText('Upload policy features document for employees')).toBeInTheDocument();
    });

    it('should render document details when document exists', async () => {
        const mockDocument = {
            id: 'feature-1',
            policyId: 'test-policy-1',
            documentId: 'doc-1',
            fileName: 'policy-features.pdf',
            originalFileName: 'policy-features.pdf',
            uploadedByName: 'John Doe',
            createdAt: '2025-11-24T10:00:00Z',
            isActive: true,
            status: 'active',
        };

        MockedPolicyFeatureService.getPolicyFeature.mockResolvedValue(mockDocument as any);

        renderComponent();

        await waitFor(() => {
            expect(screen.getByText('Document Uploaded')).toBeInTheDocument();
        });

        expect(screen.getByText('Replace Document')).toBeInTheDocument();
        expect(screen.getByText('View')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should show confirmation dialog on replace', async () => {
        const mockDocument = {
            id: 'feature-1',
            policyId: 'test-policy-1',
            documentId: 'doc-1',
            fileName: 'policy-features.pdf',
            originalFileName: 'policy-features.pdf',
            uploadedByName: 'John Doe',
            createdAt: '2025-11-24T10:00:00Z',
            isActive: true,
            status: 'active',
        };

        MockedPolicyFeatureService.getPolicyFeature.mockResolvedValue(mockDocument as any);

        // Mock window.confirm
        const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

        renderComponent();

        await waitFor(() => {
            const replaceButton = screen.getByText('Replace Document');
            fireEvent.click(replaceButton);
        });

        expect(mockConfirm).toHaveBeenCalledWith(
            'Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?'
        );

        mockConfirm.mockRestore();
    });
});
```

---

## 7. Constants and Configuration

### 7.1 API Endpoints

```typescript
// apps/ui/ui-lib/src/lib/constants/endPoints.ts

export const endPoints = {
    // ... existing endpoints
    policyFeatures: '/api/policy-features',
    // ... rest of endpoints
};
```

### 7.2 Environment Variables

```bash
# Backend Service URLs
URL_POLICY_SERVICE=http://localhost:3001
URL_DOCUMENT_SERVICE=http://localhost:3002

# Database Configuration
DB_POLICY_HOST=localhost
DB_POLICY_PORT=5432
DB_POLICY_USERNAME=postgres
DB_POLICY_PASSWORD=password
DB_POLICY_DATABASE=insurance_wellness_hub

# File Upload Configuration
MAX_FILE_SIZE_MB=25
ALLOWED_FILE_TYPES=application/pdf
```

---

## 8. Error Handling

### 8.1 Backend Error Responses

```typescript
// Standard error response format
{
    "statusCode": 400,
    "message": "File size exceeds 25 MB limit",
    "error": "Bad Request",
    "timestamp": "2025-11-24T10:00:00.000Z",
    "path": "/api/policy-features/policy-1/upload"
}
```

### 8.2 Frontend Error Handling

```typescript
// Error handling in services
export class PolicyFeatureService {
    static async uploadPolicyFeature(policyId: string, uploadData: UploadPolicyFeatureRequest): Promise<PolicyFeatureUploadResponse> {
        try {
            const response = await apiRequest(`${endPoints.policyFeatures}/${policyId}/upload`, {
                method: 'POST',
                data: uploadData
            });
            return { success: true, data: response.data };
        } catch (error: any) {
            let errorMessage = 'Upload failed';
            
            if (error.response?.status === 400) {
                errorMessage = error.response.data.message || 'Invalid file or request';
            } else if (error.response?.status === 413) {
                errorMessage = 'File size exceeds 25 MB limit';
            } else if (error.response?.status === 415) {
                errorMessage = 'Only PDF files are supported';
            }
            
            return { success: false, error: errorMessage };
        }
    }
}
```

---

## 9. Performance Considerations

### 9.1 File Upload Optimization
- Implement chunked file upload for large files
- Add progress indicators during upload
- Use compression for PDF files when possible

### 9.2 Caching Strategy
- Cache policy feature metadata in Redux state
- Implement document URL caching with expiration
- Use React Query for efficient API state management

### 9.3 Database Indexing
- Index on `policy_id` for fast policy lookups
- Index on `is_active` and `status` for filtering
- Composite index on `(policy_id, is_active, status)`

---

## 10. Security Considerations

### 10.1 File Validation
- Server-side file type validation
- File size validation (25MB limit)
- Virus scanning integration
- Filename sanitization

### 10.2 Access Control
- JWT token validation for all endpoints
- Role-based access control for admin functions
- Employee access limited to their enrolled policies

### 10.3 Data Protection
- Secure file storage with encryption at rest
- HTTPS for all API communications
- Audit logging for all document operations

---

## 11. Deployment Considerations

### 11.1 Database Migration
- Run migration script to create `policy_feature_documents` table
- Update TypeORM entity imports
- Verify indexes are created properly

### 11.2 Environment Configuration
- Update environment variables for file size limits
- Configure document service integration
- Set up proper CORS policies

### 11.3 Monitoring and Logging
- Add application logs for upload operations
- Monitor file upload performance metrics
- Set up alerts for failed uploads

---

This technical specification provides a comprehensive implementation plan for the Policy Features functionality, leveraging existing components and patterns while ensuring scalability and maintainability.