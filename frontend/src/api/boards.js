import api from './axios';

export const workspaceAPI = {
    getAll: () => api.get('/workspaces/'),
    create: (data) => api.post('/workspaces/', data),
    getOne: (id) => api.get(`/workspaces/${id}`),
    delete: (id) => api.delete(`/workspaces/${id}`),
};

export const boardAPI = {
    getAll: (workspaceId) => api.get(`/workspaces/${workspaceId}/boards`),
    create: (workspaceId, data) => api.post(`/workspaces/${workspaceId}/boards`, data),
    getOne: (id) => api.get(`/boards/${id}`),
    update: (id, data) => api.put(`/boards/${id}`, data),
    delete: (id) => api.delete(`/boards/${id}`),
};

export const postitAPI = {
    getAll: (boardId) => api.get(`/boards/${boardId}/postits`),
    getAllInWorkspace: (workspaceId) => api.get(`/workspaces/${workspaceId}/postits/all`),
    create: (boardId, data) => api.post(`/boards/${boardId}/postits`, data),
    update: (id, data) => api.patch(`/postits/${id}`, data),
    move: (id, data) => api.patch(`/postits/${id}/move`, data),
    delete: (id) => api.delete(`/postits/${id}`),
    vote: (id) => api.post(`/postits/${id}/vote`),
    getComments: (id) => api.get(`/postits/${id}/comments`),
    addComment: (id, data) => api.post(`/postits/${id}/comments`, data),
    updateComment: (id, data) => api.put(`/comments/${id}`, data),
    deleteComment: (id) => api.delete(`/comments/${id}`),
};

export const teamAPI = {
    getMembers: (workspaceId) => api.get(`/workspaces/${workspaceId}/members`),
    addMember: (workspaceId, email) => api.post(`/workspaces/${workspaceId}/members?email=${encodeURIComponent(email)}`),
    updateRole: (memberId, role) => api.patch(`/members/${memberId}/role?role=${role}`),
    removeMember: (memberId) => api.delete(`/members/${memberId}`),
    invite: (workspaceId, email, role = 'member') => api.post(`/workspaces/${workspaceId}/invite?email=${encodeURIComponent(email)}&role=${role}`),
    getInvitation: (token) => api.get(`/invitations/${token}`),
    acceptInvitation: (token) => api.post(`/invitations/${token}/accept`),
};

export const avatarAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/auth/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: () => api.delete('/auth/avatar'),
};

export const profileAPI = {
    update: (data) => api.put('/auth/me', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    deleteAccount: () => api.delete('/auth/me'),
};

export const noteAPI = {
    get: (boardId) => api.get(`/boards/${boardId}/notes`),
    update: (boardId, content) => api.put(`/boards/${boardId}/notes`, { content }),
    getAll: (boardId) => api.get(`/boards/${boardId}/notes/all`),
};

export const auditAPI = {
    getLogs: (params) => api.get('/audit/logs', { params }),
    getStats: () => api.get('/audit/stats'),
    getProcessings: () => api.get('/audit/processings'),
    createProcessing: (data) => api.post('/audit/processings', data),
    updateProcessing: (id, data) => api.put(`/audit/processings/${id}`, data),
    deleteProcessing: (id) => api.delete(`/audit/processings/${id}`),
};

export const synthesisAPI = {
    generate: (boardId) => api.post(`/boards/${boardId}/synthesis`, {}, { timeout: 180000 }),
};

export const riskAPI = {
    getAll: (boardId) => api.get(`/boards/${boardId}/risks`),
    create: (boardId, data) => api.post(`/boards/${boardId}/risks`, data),
    update: (riskId, data) => api.put(`/risks/${riskId}`, data),
    delete: (riskId) => api.delete(`/risks/${riskId}`),
    analyze: (boardId) => api.post(`/boards/${boardId}/risks/analyze`, {}, { timeout: 180000 }),
};

export const pdfAPI = {
    generate: (boardId) => api.get(`/boards/${boardId}/pdf`, { 
        responseType: 'blob',
        timeout: 60000,
    }),
};
