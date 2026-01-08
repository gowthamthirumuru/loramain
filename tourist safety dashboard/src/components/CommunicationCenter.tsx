import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Separator } from './ui/separator';
import { MessageSquare, Phone, Mail, Radio, Send, Search, User, Clock, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardStore } from '../store/store';

export function CommunicationCenter() {
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Use store for persistent messages
  const { conversations, messages, addMessage } = useDashboardStore();

  const filteredConversations = useMemo(() =>
    conversations.filter(c =>
      c.participant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [conversations, searchTerm]
  );

  const currentConversation = useMemo(() =>
    conversations.find(c => c.id === selectedConversation),
    [conversations, selectedConversation]
  );

  const currentMessages = useMemo(() =>
    messages.filter(m => m.conversationId === selectedConversation),
    [messages, selectedConversation]
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      conversationId: selectedConversation,
      sender: 'Command Center',
      message: newMessage.trim(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: true,
    };

    addMessage(message);
    setNewMessage('');
    toast.success('Message sent', {
      description: `To ${currentConversation?.participant}`
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'radio': return <Radio className="w-3 h-3" />;
      case 'phone': return <Phone className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'waiting': return 'bg-amber-500';
      case 'standby': return 'bg-neutral-400';
      default: return 'bg-neutral-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Conversation List */}
      <div className="w-[400px] border-r border-neutral-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm text-neutral-900">Communications</h2>
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 h-8 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm border-neutral-300"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-sm text-neutral-500">No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`p-4 border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50 ${selectedConversation === conversation.id ? 'bg-cyan-50 border-l-4 border-l-cyan-600' : ''
                  }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(conversation.status)}`} />
                    <span className="text-sm font-medium text-neutral-900">{conversation.participant}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {conversation.unread > 0 && (
                      <Badge variant="destructive" className="text-xs h-5 min-w-5 flex items-center justify-center">
                        {conversation.unread}
                      </Badge>
                    )}
                    <span className="text-xs text-neutral-500">{conversation.time}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant={getPriorityBadge(conversation.priority) as any} className="text-xs">
                    {conversation.priority}
                  </Badge>
                  <div className="flex items-center text-xs text-neutral-500">
                    {getTypeIcon(conversation.type)}
                    <span className="ml-1 capitalize">{conversation.type}</span>
                  </div>
                </div>
                <p className="text-xs text-neutral-600 truncate">{conversation.lastMessage}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Message Thread */}
      <div className="flex-1 bg-neutral-50 flex flex-col">
        {currentConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 bg-white border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900">
                      {currentConversation.participant}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(currentConversation.status)}`} />
                      <span className="capitalize">{currentConversation.status}</span>
                      <span>•</span>
                      {getTypeIcon(currentConversation.type)}
                      <span className="capitalize">{currentConversation.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" className="h-8 text-xs border-neutral-300">
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs border-neutral-300">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${msg.isOwnMessage
                        ? 'bg-cyan-600 text-white'
                        : 'bg-white border border-neutral-200'
                      }`}
                  >
                    <p className={`text-sm ${msg.isOwnMessage ? 'text-white' : 'text-neutral-900'}`}>
                      {msg.message}
                    </p>
                    <div className={`flex items-center justify-end mt-1 text-xs ${msg.isOwnMessage ? 'text-cyan-100' : 'text-neutral-500'
                      }`}>
                      <Clock className="w-3 h-3 mr-1" />
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-neutral-200">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 h-10 text-sm border-neutral-300"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 h-10 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm text-neutral-900 mb-1">No Conversation Selected</h3>
              <p className="text-xs text-neutral-500">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
