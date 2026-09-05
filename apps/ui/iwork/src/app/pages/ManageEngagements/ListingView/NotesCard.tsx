import React from 'react';
import {
  NormalActivityContainer,
  NormalInfoNotes,
  NormalHeader,
  EllipsisNormalTaskName,
  NotesIconContainer,
  ContentBoxForDetails,
  NotesIconWrapper, // <-- import new styled component
  NotesDescription,
  NotesIconImg, // <-- import new styled component
} from './styles';
import NotesIcon from '../../../assets/svgs/notes-icon.svg';

interface NotesCardProps {
  note: any;
  onEdit?: (note: any) => void;
  onClick?: (note: any) => void;
}

const NotesCard: React.FC<NotesCardProps> = ({ note, onEdit, onClick }) => {
  const [hovered, setHovered] = React.useState(false);

  const handleCardClick = () => {
    if (onClick) {
      onClick(note);
    } else if (onEdit) {
      onEdit(note);
    }
  };

  return (
    <NormalActivityContainer
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
      title="Click to edit"
    >
      <NormalInfoNotes>
        <NormalHeader>
          <NotesIconContainer>
            <NotesIconWrapper>
              <NotesIconImg src={NotesIcon} alt="Notes" />
            </NotesIconWrapper>
          </NotesIconContainer>
          <EllipsisNormalTaskName title={note.title || note.name}>
            {note.title || note.name}
          </EllipsisNormalTaskName>
        </NormalHeader>
        <ContentBoxForDetails>
          {note.description && (
            <NotesDescription>
              {note.description}
            </NotesDescription>
          )}
        </ContentBoxForDetails>
      </NormalInfoNotes>
    </NormalActivityContainer>
  );
};

export default NotesCard;
