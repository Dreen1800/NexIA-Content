import React from 'react';
import ContentCreator from '../components/ContentCreator';

const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 20%, #e2e8f0 40%, #c084fc 70%, #8b5cf6 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    position: 'relative'
};

function ContentCreatorPage() {
    return (
        <div style={pageStyles}>
            <ContentCreator />
        </div>
    );
}

export default ContentCreatorPage;