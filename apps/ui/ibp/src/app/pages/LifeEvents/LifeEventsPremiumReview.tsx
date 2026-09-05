import { capitalizeFirst } from '../../utils';
import React from 'react';
import { formatAmountWithCurrency, useLocalization } from '@ui/ui-lib';
import {
  Box, 
  Typography, 
  Card,
  CardContent,
  Table,
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  PremiumContainer,
  SummaryCard,
  PremiumCard
} from './styles';

interface DependentData {
  tempKey: string;
  name: string;
  relationship: string;
  gender: string;
  dateOfBirth: string;
  isNewlyAdded?: boolean;
}

interface LifeEventsPremiumReviewProps {
  selectedLifeEvent: string;
  dependents: DependentData[];
  lifeEventData: any;
}

const calculateAge = (dateOfBirth: string) => {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Mock premium calculation (in real implementation, this would come from API)
const calculatePremium = (dependent: DependentData, lifeEvent: string) => {
  const basePremium = 5000;
  const ageMultiplier = calculateAge(dependent.dateOfBirth) > 40 ? 1.5 : 1;
  const relationshipMultiplier = dependent.relationship.toLowerCase().includes('parent') ? 2 : 1;
  return Math.round(basePremium * ageMultiplier * relationshipMultiplier);
};

const LifeEventsPremiumReview: React.FC<LifeEventsPremiumReviewProps> = ({
  selectedLifeEvent,
  dependents,
  lifeEventData
}) => {
  const { localizationData } = useLocalization();
  const totalPremium = dependents.reduce((total, dependent) => {
    return total + calculatePremium(dependent, selectedLifeEvent);
  }, 0);

  const formatCurrency = (amount: number) => {
    return `${formatAmountWithCurrency(amount, localizationData?.data)}`;
  };

  return (
    <PremiumContainer>
      <Typography variant="h5" gutterBottom>
        Review Premium Changes
      </Typography>

      {/* Life Event Summary */}
      <SummaryCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Life Event Summary
          </Typography>
          <Typography variant="body1" sx={{ marginBottom: 2 }}>
            <strong>Event:</strong> {lifeEventData?.title || selectedLifeEvent}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {lifeEventData?.description}
          </Typography>
        </CardContent>
      </SummaryCard>

      {/* Premium Impact */}
      <PremiumCard>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Premium Impact
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body1">
              Additional Annual Premium
            </Typography>
            <Typography variant="h4">
              {formatCurrency(totalPremium)}
            </Typography>
          </Box>
          <Divider style={{ margin: '16px 0', backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            This is the estimated additional premium for adding {dependents.length} dependent{dependents.length > 1 ? 's' : ''}.
          </Typography>
        </CardContent>
      </PremiumCard>

      {/* Dependents Breakdown */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Dependents to be Added ({dependents.length})
          </Typography>
          
          {dependents.length === 0 ? (
            <Typography color="text.secondary">
              No dependents selected.
            </Typography>
          ) : (
            <Paper variant="outlined">
              <>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Relationship</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Annual Premium</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dependents.map((dependent) => {
                      const premium = calculatePremium(dependent, selectedLifeEvent);
                      return (
                        <TableRow key={dependent.tempKey}>
                          <TableCell>{dependent.name}</TableCell>
                          <TableCell>{capitalizeFirst(dependent.relationship)}</TableCell>
                          <TableCell>{calculateAge(dependent.dateOfBirth)} years</TableCell>
                          <TableCell>
                            {dependent.isNewlyAdded ? (
                              <Chip label="New" color="primary" size="small" />
                            ) : (
                              <Chip label="Existing" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(premium)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={4} align="right">
                        <Typography variant="h6">Total Additional Premium:</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {formatCurrency(totalPremium)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card style={{ marginTop: 24, backgroundColor: '#fff3cd' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.dark">
            Important Notes
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: 2 }}>
            • Premium calculations are estimates and may vary based on final policy terms
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: 2 }}>
            • Changes will be effective from the next billing cycle
          </Typography>
          <Typography variant="body2" sx={{ marginBottom: 2 }}>
            • Required documents must be submitted for the changes to take effect
          </Typography>
          <Typography variant="body2">
            • You can review and modify your selections in the previous steps
          </Typography>
        </CardContent>
      </Card>
    </PremiumContainer>
  );
};

export default LifeEventsPremiumReview;