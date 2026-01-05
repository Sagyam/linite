'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export interface SearchResult {
  identifier: string;
  name: string;
  summary?: string;
  version?: string;
  homepage?: string;
  license?: string;
  maintainer?: string;
  source: string;
}

interface PackageSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddResult: (result: SearchResult) => void;
}

export function PackageSearchDialog({
  open,
  onOpenChange,
  onAddResult,
}: PackageSearchDialogProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchData, setSearchData] = useState({
    sourceSlug: 'flatpak',
    query: '',
  });

  const handleSearch = async () => {
    if (!searchData.query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: searchData.sourceSlug,
          query: searchData.query,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.count || data.results?.length || 0;
        setSearchResults(data.results || []);
        toast.success(`Found ${count} result${count !== 1 ? 's' : ''}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Search External APIs</DialogTitle>
          <DialogDescription>
            Search for packages from external package sources
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 space-y-2">
              <Label htmlFor="searchSource">Source *</Label>
              <Select
                value={searchData.sourceSlug}
                onValueChange={(value) =>
                  setSearchData({ ...searchData, sourceSlug: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="flatpak">Flatpak</SelectItem>
                  <SelectItem value="snap">Snap</SelectItem>
                  <SelectItem value="aur">AUR</SelectItem>
                  <SelectItem value="homebrew">Homebrew</SelectItem>
                  <SelectItem value="winget">Winget</SelectItem>
                  <SelectItem value="repology">Repology</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="searchQuery">Search Query *</Label>
              <div className="flex gap-2">
                <Input
                  id="searchQuery"
                  value={searchData.query}
                  onChange={(e) =>
                    setSearchData({ ...searchData, query: e.target.value })
                  }
                  placeholder="e.g., firefox"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result, index) => (
                      <TableRow key={`${result.source}-${result.identifier}-${index}`}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{result.name}</div>
                            {result.summary && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {result.summary}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {result.identifier}
                          </code>
                        </TableCell>
                        <TableCell>{result.version || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => onAddResult(result)}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
