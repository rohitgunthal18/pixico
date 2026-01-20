import React from 'react';

interface JsonLdProps {
    data: any;
}

const JsonLd: React.FC<JsonLdProps> = ({ data }) => {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            suppressHydrationWarning
        />
    );
};

export default JsonLd;
