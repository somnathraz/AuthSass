'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Users, 
  Lock, 
  Globe, 
  Search,
  Plus,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import { useQuery } from '@apollo/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../lib/utils';
import { GET_USER_ORGANIZATIONS } from '../../graphql/queries/organization';
import { useOrganizationStore } from '../../store/organization';
import type { UserOrganization } from '../../store/organization';

interface OrganizationSelectorProps {
  className?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' | 'GUEST' | 'OWNER' | 'VIEWER';
type AccessType = 'FULL' | 'SCOPED' | 'DIRECT' | 'ORGANIZATION';

const roleIcons = {
  SUPER_ADMIN: <Shield className="w-3 h-3 text-red-500" />,
  ADMIN: <Star className="w-3 h-3 text-yellow-500" />,
  MEMBER: <Users className="w-3 h-3 text-blue-500" />,
  GUEST: <Lock className="w-3 h-3 text-gray-500" />,
  OWNER: <Star className="w-3 h-3 text-gold-500" />,
  VIEWER: <Users className="w-3 h-3 text-gray-400" />,
};

const accessTypeIcons = {
  FULL: <Globe className="w-3 h-3 text-green-500" />,
  SCOPED: <Lock className="w-3 h-3 text-orange-500" />,
  DIRECT: <Zap className="w-3 h-3 text-blue-500" />,
  ORGANIZATION: <Building2 className="w-3 h-3 text-purple-500" />,
};

const accessTypeLabels = {
  FULL: 'Full Access',
  SCOPED: 'App-Specific',
  DIRECT: 'Direct Access',
  ORGANIZATION: 'Organization',
};

export const OrganizationSelector: React.FC<OrganizationSelectorProps> = ({
  className,
  showCreateButton = true,
  onCreateClick,
  variant = 'default'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const { 
    currentOrganization, 
    setCurrentOrganization,
    organizations,
    setOrganizations
  } = useOrganizationStore();

  // Fetch user organizations with enhanced data
  const { loading, error, refetch } = useQuery(GET_USER_ORGANIZATIONS, {
    variables: {
      input: {
        filters: {}
      }
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    onCompleted: (data: { userOrganizations: UserOrganization[] }) => {
      if (data?.userOrganizations) {
        setOrganizations(data.userOrganizations);
        
        // Set default organization if none selected
        if (!currentOrganization && data.userOrganizations.length > 0) {
          const personalOrg = data.userOrganizations.find(
            (org: UserOrganization) => org.type === 'PERSONAL'
          );
          setCurrentOrganization(personalOrg || data.userOrganizations[0]);
        }
      }
    }
  });

  // Filter organizations based on search
  const filteredOrganizations = useMemo(() => {
    if (!organizations) return [];
    
    return organizations.filter((org: UserOrganization) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.userRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.accessType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [organizations, searchQuery]);

  // Group organizations by type
  const groupedOrganizations = useMemo(() => {
    const groups: {
      PERSONAL: UserOrganization[];
      ORGANIZATION: UserOrganization[];
    } = {
      PERSONAL: [],
      ORGANIZATION: []
    };
    
    filteredOrganizations.forEach((org: UserOrganization) => {
      if (org.type === 'PERSONAL' || org.type === 'ORGANIZATION') {
        groups[org.type].push(org);
      }
    });
    
    return groups;
  }, [filteredOrganizations]);

  const handleOrganizationSelect = (organization: UserOrganization) => {
    setCurrentOrganization(organization);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getOrganizationAvatar = (org: UserOrganization) => {
    if (org.imageUrl) {
      return <AvatarImage src={org.imageUrl} alt={org.name} />;
    }
    
    return (
      <AvatarFallback className={cn(
        "text-xs font-medium",
        org.type === 'PERSONAL' 
          ? "bg-blue-100 text-blue-700" 
          : "bg-purple-100 text-purple-700"
      )}>
        {org.name.charAt(0).toUpperCase()}
      </AvatarFallback>
    );
  };

  const renderOrganizationItem = (org: UserOrganization) => {
    const isSelected = currentOrganization?.id === org.id;
    
    return (
      <DropdownMenuItem
        key={org.id}
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer",
          "focus:bg-accent focus:text-accent-foreground",
          isSelected && "bg-accent text-accent-foreground"
        )}
        onClick={() => handleOrganizationSelect(org)}
      >
        <Avatar className="w-8 h-8">
          {getOrganizationAvatar(org)}
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {org.name}
            </span>
            {isSelected && (
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              {roleIcons[org.userRole as Role]}
              <span className="text-xs text-muted-foreground">
                {org.userRole}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {accessTypeIcons[org.accessType as AccessType]}
              <span className="text-xs text-muted-foreground">
                {accessTypeLabels[org.accessType as AccessType]}
              </span>
            </div>
            
            {org.appCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {org.appCount} app{org.appCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </DropdownMenuItem>
    );
  };

  if (loading && !organizations) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Skeleton className="w-8 h-8 rounded-full" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-4 h-4" />
      </div>
    );
  }

  if (error && !organizations) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        className={className}
      >
        <Building2 className="w-4 h-4 mr-2" />
        Retry
      </Button>
    );
  }

  const renderTrigger = () => {
    if (!currentOrganization) {
      return (
        <Button variant="outline" size="sm" className={className}>
          <Building2 className="w-4 h-4 mr-2" />
          Select Organization
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      );
    }

    switch (variant) {
      case 'compact':
        return (
          <Button variant="ghost" size="sm" className={cn("p-2", className)}>
            <Avatar className="w-6 h-6">
              {getOrganizationAvatar(currentOrganization)}
            </Avatar>
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        );
        
      case 'detailed':
        return (
          <Button
            variant="outline"
            className={cn("justify-start h-auto p-3", className)}
          >
            <Avatar className="w-8 h-8 mr-3">
              {getOrganizationAvatar(currentOrganization)}
            </Avatar>
            <div className="flex-1 text-left">
              <div className="font-medium text-sm">
                {currentOrganization.name}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {roleIcons[currentOrganization.userRole as Role]}
                {currentOrganization.userRole}
                <span>•</span>
                {accessTypeIcons[currentOrganization.accessType as AccessType]}
                {accessTypeLabels[currentOrganization.accessType as AccessType]}
              </div>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        );
        
      default:
        return (
          <Button variant="outline" className={cn("justify-start", className)}>
            <Avatar className="w-6 h-6 mr-2">
              {getOrganizationAvatar(currentOrganization)}
            </Avatar>
            <span className="truncate max-w-32">
              {currentOrganization.name}
            </span>
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        );
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div
          onClick={(e) => {
            // Ensure proper dropdown trigger event handling
            e.stopPropagation();
            console.log('🏢 Organization selector clicked');
          }}
          style={{
            // Ensure trigger container is always clickable
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1
          }}
        >
          {renderTrigger()}
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-80" 
        align="start"
        sideOffset={4}
        style={{
          // Ensure dropdown content is above other elements
          zIndex: 1000
        }}
        onCloseAutoFocus={(e) => {
          // Prevent focus issues that might break subsequent clicks
          e.preventDefault();
        }}
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Switch Organization
        </DropdownMenuLabel>
        
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Personal Organizations */}
        {groupedOrganizations.PERSONAL.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2">
              Personal
            </DropdownMenuLabel>
            {groupedOrganizations.PERSONAL.map(renderOrganizationItem)}
          </DropdownMenuGroup>
        )}
        
        {/* Team Organizations */}
        {groupedOrganizations.ORGANIZATION.length > 0 && (
          <DropdownMenuGroup>
            {groupedOrganizations.PERSONAL.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2">
              Teams
            </DropdownMenuLabel>
            {groupedOrganizations.ORGANIZATION.map(renderOrganizationItem)}
          </DropdownMenuGroup>
        )}
        
        {filteredOrganizations.length === 0 && searchQuery && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No organizations found for &quot;{searchQuery}&quot;
          </div>
        )}
        
        {/* Create Organization */}
        {showCreateButton && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 p-3 cursor-pointer"
              onClick={onCreateClick}
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Create Organization</span>
              <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrganizationSelector; 