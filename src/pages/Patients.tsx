import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  Eye,
  Edit,
  Calendar,
  FileText,
  UserX,
  MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "react-router-dom";

const Patients = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock patients data
  const patients = [
    {
      id: "1",
      firstName: "María",
      lastName: "López",
      email: "maria.lopez@email.com",
      phone: "+52 55 1234 5678",
      lastVisit: "2025-01-25",
      totalSpent: 15600,
      isActive: true,
    },
    {
      id: "2",
      firstName: "Carlos",
      lastName: "García",
      email: "carlos.garcia@email.com",
      phone: "+52 55 9876 5432",
      lastVisit: "2025-01-20",
      totalSpent: 8900,
      isActive: true,
    },
    {
      id: "3",
      firstName: "Ana",
      lastName: "Martínez",
      email: "ana.martinez@email.com",
      phone: "+52 55 5555 1234",
      lastVisit: "2025-01-15",
      totalSpent: 23400,
      isActive: true,
    },
    {
      id: "4",
      firstName: "Roberto",
      lastName: "Sánchez",
      email: "roberto.sanchez@email.com",
      phone: "+52 55 4321 8765",
      lastVisit: "2024-12-10",
      totalSpent: 5200,
      isActive: false,
    },
    {
      id: "5",
      firstName: "Laura",
      lastName: "Hernández",
      email: "laura.hernandez@email.com",
      phone: "+52 55 1111 2222",
      lastVisit: "2025-01-28",
      totalSpent: 12300,
      isActive: true,
    },
  ];

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      `${patient.firstName} ${patient.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && patient.isActive) ||
      (statusFilter === "inactive" && !patient.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {t("patients.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredPatients.length} {t("patients.allPatients").toLowerCase()}
            </p>
          </div>
          <Button asChild>
            <Link to="/patients/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("patients.newPatient")}
            </Link>
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("patients.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("patients.allPatients")}</SelectItem>
                      <SelectItem value="active">{t("patients.active")}</SelectItem>
                      <SelectItem value="inactive">{t("patients.inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Patients table */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("patients.title")}</TableHead>
                      <TableHead className="hidden md:table-cell">{t("patients.phone")}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("patients.lastVisit")}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t("patients.totalSpent")}</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPatients.map((patient, index) => (
                      <motion.tr
                        key={patient.id}
                        variants={itemVariants}
                        className="group hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                {patient.firstName[0]}
                                {patient.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {patient.firstName} {patient.lastName}
                              </p>
                              <p className="text-sm text-muted-foreground md:hidden">
                                {patient.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <span>{patient.phone}</span>
                            <a
                              href={`https://wa.me/${patient.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MessageCircle className="h-4 w-4 text-status-confirmed" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {formatDate(patient.lastVisit)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-medium">
                          ${patient.totalSpent.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={patient.isActive ? "default" : "secondary"}
                            className={patient.isActive ? "status-confirmed border-0" : ""}
                          >
                            {patient.isActive ? t("patients.active") : t("patients.inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link to={`/patients/${patient.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                              <Link to={`/patients/${patient.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {t("appointments.newAppointment")}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  {t("budgets.newBudget")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <UserX className="mr-2 h-4 w-4" />
                                  Desactivar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredPatients.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("patients.noPatients")}
                  </h3>
                  <p className="text-muted-foreground mb-4">{t("patients.addFirst")}</p>
                  <Button asChild>
                    <Link to="/patients/new">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("patients.newPatient")}
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Patients;
