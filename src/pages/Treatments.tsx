import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/layout/AppLayout";
import NewTreatmentDialog from "@/components/treatments/NewTreatmentDialog";
import EditTreatmentDialog from "@/components/treatments/EditTreatmentDialog";
import DeleteTreatmentDialog from "@/components/treatments/DeleteTreatmentDialog";
import { supabase } from "@/integrations/supabase/client";

interface Treatment {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  duration_minutes: number | null;
  is_active: boolean | null;
}

const Treatments = () => {
  const { t } = useTranslation();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showNewTreatment, setShowNewTreatment] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [deletingTreatment, setDeletingTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .order("name");

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error("Error fetching treatments:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [...new Set(treatments.map(t => t.category).filter(Boolean))];

  const filteredTreatments = treatments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("treatments.title")}</h1>
            <p className="text-muted-foreground">Catálogo de tratamientos de la clínica</p>
          </div>
          <Button onClick={() => setShowNewTreatment(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tratamiento
          </Button>
        </div>

        <NewTreatmentDialog
          open={showNewTreatment}
          onOpenChange={(open) => {
            setShowNewTreatment(open);
            if (!open) fetchTreatments();
          }}
        />
        
        <EditTreatmentDialog
          open={!!editingTreatment}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTreatment(null);
              fetchTreatments();
            }
          }}
          treatment={editingTreatment}
        />
        
        <DeleteTreatmentDialog
          open={!!deletingTreatment}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingTreatment(null);
              fetchTreatments();
            }
          }}
          treatment={deletingTreatment}
        />
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tratamientos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Treatments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredTreatments.length} Tratamientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTreatments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron tratamientos</p>
                <Button className="mt-4" onClick={() => setShowNewTreatment(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer tratamiento
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreatments.map((treatment) => (
                    <TableRow key={treatment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{treatment.name}</p>
                          {treatment.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {treatment.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {treatment.category && (
                          <Badge variant="secondary">{treatment.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {treatment.duration_minutes} min
                      </TableCell>
                      <TableCell className="font-medium">
                        ${treatment.price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={treatment.is_active ? "default" : "secondary"}>
                          {treatment.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTreatment(treatment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingTreatment(treatment)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
};

export default Treatments;