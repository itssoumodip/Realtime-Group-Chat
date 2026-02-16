import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { MessageCircle } from 'lucide-react';

const NameEntry = ({ onNameSubmit }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <img className='h-16 w-16 rounded-full' src='/catgroup.jpg'></img>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome</h1>
          <p className="text-muted-foreground text-sm">Enter your name to join the conversation</p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                disabled={!name.trim()}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NameEntry;
