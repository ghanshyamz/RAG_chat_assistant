import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Document {
  id: string;
  filename: string;
  content_type: string;
  status: 'uploaded' | 'processing' | 'indexed' | 'error';
  created_at: string;
}

interface DocumentState {
  documents: Document[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  loading: false,
  uploading: false,
  error: null,
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    setDocuments: (state, action: PayloadAction<Document[]>) => {
      state.documents = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setUploading: (state, action: PayloadAction<boolean>) => {
      state.uploading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setDocuments, setLoading, setUploading, setError } = documentSlice.actions;

// Async Thunks
export const fetchDocuments = () => async (dispatch: any) => {
  dispatch(setLoading(true));
  dispatch(setError(null));
  try {
    const response = await fetch('http://localhost:8000/api/documents');
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }
    const data = await response.json();
    dispatch(setDocuments(data.documents || []));
  } catch (err: any) {
    console.error('Fetch documents failed:', err);
    dispatch(setError(err.message || 'Failed to retrieve documents'));
  } finally {
    dispatch(setLoading(false));
  }
};

export const uploadDocument = (file: File) => async (dispatch: any) => {
  dispatch(setUploading(true));
  dispatch(setError(null));
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:8000/api/documents', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Upload error' }));
      throw new Error(errData.detail || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    // Fetch updated list immediately
    await dispatch(fetchDocuments());
    return data;
  } catch (err: any) {
    console.error('Upload document failed:', err);
    dispatch(setError(err.message || 'Failed to upload document'));
    throw err;
  } finally {
    dispatch(setUploading(false));
  }
};

export const deleteDocument = (id: string) => async (dispatch: any) => {
  dispatch(setError(null));
  try {
    const response = await fetch(`http://localhost:8000/api/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: 'Deletion error' }));
      throw new Error(errData.detail || `Deletion failed with status ${response.status}`);
    }

    // Refresh list
    await dispatch(fetchDocuments());
  } catch (err: any) {
    console.error('Delete document failed:', err);
    dispatch(setError(err.message || 'Failed to delete document'));
    throw err;
  }
};

export default documentSlice.reducer;
