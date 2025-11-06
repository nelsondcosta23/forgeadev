import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface RoadmapItem {
  id: string;
  priority: "High" | "Medium" | "Low";
  title: string;
  created_at: string;
}

interface RoadmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoadmapDialog({ open, onOpenChange }: RoadmapDialogProps) {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    priority: "Medium" as "High" | "Medium" | "Low",
    title: "",
  });

  useEffect(() => {
    if (open) {
      fetchRoadmap();
    }
  }, [open]);

  const fetchRoadmap = async () => {
    const { data, error } = await supabase
      .from("admin_roadmap")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading roadmap");
      console.error(error);
      return;
    }

    setItems((data || []) as RoadmapItem[]);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("admin_roadmap")
        .update(formData)
        .eq("id", editingId);

      if (error) {
        toast.error("Error updating item");
        console.error(error);
        return;
      }

      toast.success("Item updated successfully");
    } else {
      const { error } = await supabase
        .from("admin_roadmap")
        .insert([formData]);

      if (error) {
        toast.error("Error creating item");
        console.error(error);
        return;
      }

      toast.success("Item created successfully");
    }

    setFormData({ priority: "Medium", title: "" });
    setIsAddingNew(false);
    setEditingId(null);
    fetchRoadmap();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { error } = await supabase
      .from("admin_roadmap")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error deleting item");
      console.error(error);
      return;
    }

    toast.success("Item deleted successfully");
    fetchRoadmap();
  };

  const handleEdit = (item: RoadmapItem) => {
    setFormData({
      priority: item.priority,
      title: item.title,
    });
    setEditingId(item.id);
    setIsAddingNew(true);
  };

  const handleCancel = () => {
    setFormData({ priority: "Medium", title: "" });
    setIsAddingNew(false);
    setEditingId(null);
  };

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColor = {
    High: "text-red-500 border-red-500/30 bg-red-500/10",
    Medium: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10",
    Low: "text-green-500 border-green-500/30 bg-green-500/10",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Project Roadmap</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Add Button */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search roadmap items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
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
                        <span className="text-xs text-muted-foreground">
                          Created: {format(new Date(item.created_at), "MMM dd, yyyy HH:mm")}
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
                        onClick={() => handleDelete(item.id)}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
