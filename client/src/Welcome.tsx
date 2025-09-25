import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Welcome: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 text-center" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 className="mb-4">Welcome to Live Polling System</h1>
        <p className="mb-4">Please select the role that best describes you to begin using the live polling system.</p>
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <div className={`card border ${selectedRole === 'student' ? 'border-primary' : ''} p-3 cursor-pointer`} onClick={() => handleRoleSelect('student')}>
              <h5>I'm a Student</h5>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className={`card border ${selectedRole === 'teacher' ? 'border-primary' : ''} p-3 cursor-pointer`} onClick={() => handleRoleSelect('teacher')}>
              <h5>I'm a Teacher</h5>
              <p>Submit answers and view live poll results in real-time.</p>
            </div>
          </div>
        </div>
        <Link
          to={selectedRole === 'student' ? '/student' : selectedRole === 'teacher' ? '/teacher' : '#'}
          className={`btn btn-primary ${!selectedRole ? 'disabled' : ''}`}
        >
          Continue
        </Link>
      </div>
    </div>
  );
};

export default Welcome;