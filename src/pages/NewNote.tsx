
import React from 'react';
import Layout from '@/components/Layout';
import FiscalNoteForm from '@/components/fiscal/FiscalNoteForm';

const NewNote: React.FC = () => {
  return (
    <Layout>
      <FiscalNoteForm />
    </Layout>
  );
};

export default NewNote;
