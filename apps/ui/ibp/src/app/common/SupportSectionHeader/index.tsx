import React from 'react'
import { SupportSectionHeaderContainer, SupportSectionHeaderImage, SupportSectionHeaderText } from './styles'

interface SupportSectionHeaderProps {
  image: string;
  text: string;
  alt?: string;
}

const SupportSectionHeader: React.FC<SupportSectionHeaderProps> = ({ image, text, alt = 'Section Header' }) => {
  return (
    <SupportSectionHeaderContainer>
    <SupportSectionHeaderImage src={image} alt={alt} />
    <SupportSectionHeaderText>{text}</SupportSectionHeaderText>
    </SupportSectionHeaderContainer>
  )
}

export default SupportSectionHeader