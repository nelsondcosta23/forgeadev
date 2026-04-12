import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { format, isValid, parseISO } from "date-fns";

const safeFormatDate = (dateStr: string | null | undefined, formatStr: string = "MMM dd, yyyy HH:mm") => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (!isValid(date)) return "Invalid Date";
    return format(date, formatStr);
  } catch (e) {
    return "Invalid Date";
  }
};
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RoadmapItem {
  id: string;
  priority: "High" | "Medium" | "Low";
  title: string;
  status: "todo" | "in_progress" | "completed";
  created: string;
}

export function RoadmapContent() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showHistory, setShowHistory] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    priority: "Medium" as "High" | "Medium" | "Low",
    title: "",
    status: "todo" as "todo" | "in_progress" | "completed",
  });

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const data = await api.get("/api/pb/admin_roadmap");
      setItems((data || []) as RoadmapItem[]);
    } catch (error) {
      toast.error("Error loading roadmap");
      console.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      if (editingId) {
        await api.patch(`/api/pb/admin_roadmap?id=${editingId}`, formData);
        toast.success("Item updated successfully");
      } else {
        await api.post("/api/pb/admin_roadmap", formData);
        toast.success("Item created successfully");
      }
    } catch (error) {
      toast.error(editingId ? "Error updating item" : "Error creating item");
      console.error(error);
      return;
    }

    setFormData({ priority: "Medium", title: "", status: "todo" });
    setIsAddingNew(false);
    setEditingId(null);
    setEditDialogOpen(false);
    fetchRoadmap();
  };

  const openDeleteDialog = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/api/pb/admin_roadmap?id=${itemToDelete}`);
      toast.success("Item deleted successfully");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchRoadmap();
    } catch (error) {
      toast.error("Error deleting item");
      console.error(error);
    }
  };

  const handleEdit = (item: RoadmapItem) => {
    setFormData({
      priority: item.priority,
      title: item.title,
      status: item.status,
    });
    setEditingId(item.id);
    setEditDialogOpen(true);
  };

  const handleCancel = () => {
    setFormData({ priority: "Medium", title: "", status: "todo" });
    setIsAddingNew(false);
    setEditingId(null);
  };

  const priorityOrder = { High: 1, Medium: 2, Low: 3 };

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      
      // Se showHistory é true, mostrar apenas completas
      // Se showHistory é false, mostrar apenas não completas
      const matchesHistoryMode = showHistory 
        ? item.status === "completed" 
        : item.status !== "completed";
      
      return matchesSearch && matchesStatus && matchesHistoryMode;
    })
    .sort((a, b) => {
      // Sort by priority: High > Medium > Low
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Within same priority, sort by creation date (oldest first)
      const dateA = new Date(a.created).getTime();
      const dateB = new Date(b.created).getTime();
      
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      
      return dateA - dateB;
    });

  const priorityColor = {
    High: "text-red-500 border-red-500/30 bg-red-500/10",
    Medium: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
    Low: "text-green-500 border-green-500/30 bg-green-500/10",
  };

  const statusConfig = {
    todo: { label: "To Do", variant: "outline" as const },
    in_progress: { label: "In Progress", variant: "default" as const },
    completed: { label: "Completed", variant: "secondary" as const },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Project Roadmap</CardTitle>
            <CardDescription>
              View and manage the project roadmap
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roadmap items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant={showHistory ? "default" : "outline"} 
            onClick={() => setShowHistory(!showHistory)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            {showHistory ? "Tarefas Ativas" : "Histórico"}
          </Button>
        </div>

        {/* Add/Edit Form */}
        {isAddingNew && (
          <Card className="p-4 space-y-4 border-primary/30 bg-primary/5">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "High" | "Medium" | "Low") =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter roadmap item title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "todo" | "in_progress" | "completed") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </Card>
        )}

        {/* Roadmap List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No roadmap items found
            </p>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`p-4 border ${priorityColor[item.priority]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-1 rounded border">
                        {item.priority}
                      </span>
                      <Badge variant={statusConfig[item.status].variant}>
                        {statusConfig[item.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Created: {safeFormatDate(item.created)}
                      </span>
                    </div>
                    <p className="text-sm">{item.title}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      className="h-8 w-8"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteDialog(item.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "High" | "Medium" | "Low") =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Item title"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "todo" | "in_progress" | "completed") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setEditingId(null);
                setFormData({ priority: "Medium", title: "", status: "todo" });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isto irá apagar permanentemente este item do roadmap.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
